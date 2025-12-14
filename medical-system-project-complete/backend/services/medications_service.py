"""
Medications Service - Fetches medication data from openFDA Drug Label API.

Architecture:
- This service acts as a proxy/wrapper around openFDA API
- Fetches and normalizes medication data from external API
- Generates image search queries for medications
- Follows clean architecture: external API -> service -> database -> API endpoint

Note: openFDA API does not require API key for public access, but rate limits apply.
"""
import logging
from typing import Dict, List, Optional
import httpx
from urllib.parse import quote

logger = logging.getLogger(__name__)


class MedicationsService:
    """
    Service for fetching medication data from openFDA Drug Label API.
    
    openFDA Documentation: https://open.fda.gov/apis/drug/label/
    """

    def __init__(self):
        # openFDA Drug Label API base URL
        # No API key required for public access (rate limit: 240 requests/min)
        self.base_url = "https://api.fda.gov/drug/label.json"
        self.timeout = 30.0

    def _generate_image_search_url(self, medication_name: str, form: Optional[str] = None) -> str:
        """
        Generate an image search query URL for medication.
        
        Since openFDA doesn't provide images, we generate a search query that
        can be used with external image search APIs or services.
        This is acceptable for educational projects.
        
        Args:
            medication_name: Name of the medication
            form: Form of medication (tablet, capsule, etc.)
        
        Returns:
            Image search query URL (using a placeholder service or Google Images search)
        """
        # Create search query: "MedicationName tablet packaging" or similar
        search_query = f"{medication_name}"
        if form:
            search_query += f" {form} packaging"
        else:
            search_query += " medication packaging"
        
        # URL encode the query
        encoded_query = quote(search_query)
        
        # Return a Google Images search URL (educational use only)
        # In production, you might use a dedicated image API
        return f"https://www.google.com/search?tbm=isch&q={encoded_query}"
    
    def _normalize_openfda_response(self, result: Dict) -> Dict:
        """
        Normalize openFDA API response to our internal schema.
        
        openFDA returns complex nested structures. This method extracts
        and normalizes the data to match our Medication model.
        
        Args:
            result: Single result object from openFDA API response
        
        Returns:
            Normalized medication data dictionary
        """
        # Extract product name (brand name)
        name = "Unknown Medication"
        if "products" in result and result["products"]:
            product = result["products"][0]
            if "brand_name" in product and product["brand_name"]:
                name = product["brand_name"][0] if isinstance(product["brand_name"], list) else product["brand_name"]
            elif "brand_name" in result and result["brand_name"]:
                name = result["brand_name"][0] if isinstance(result["brand_name"], list) else result["brand_name"]
            elif "openfda" in result and "brand_name" in result["openfda"]:
                brand_names = result["openfda"]["brand_name"]
                if brand_names:
                    name = brand_names[0]
        
        # Extract generic name (active ingredient)
        generic_name = None
        if "openfda" in result and "generic_name" in result["openfda"]:
            generic_names = result["openfda"]["generic_name"]
            if generic_names:
                generic_name = generic_names[0]
        elif "generic_name" in result and result["generic_name"]:
            generic_name = result["generic_name"][0] if isinstance(result["generic_name"], list) else result["generic_name"]
        
        # Extract description (indications or purpose)
        description = None
        if "indications_and_usage" in result and result["indications_and_usage"]:
            description = result["indications_and_usage"][0] if isinstance(result["indications_and_usage"], list) else result["indications_and_usage"]
        elif "purpose" in result and result["purpose"]:
            description = result["purpose"][0] if isinstance(result["purpose"], list) else result["purpose"]
        elif "description" in result and result["description"]:
            desc_text = result["description"][0] if isinstance(result["description"], list) else result["description"]
            # Truncate long descriptions
            if desc_text:
                description = desc_text[:500] + "..." if len(desc_text) > 500 else desc_text
        
        # Extract form (dosage form)
        form = None
        if "openfda" in result and "product_type" in result["openfda"]:
            product_types = result["openfda"]["product_type"]
            if product_types:
                form = product_types[0]
        elif "products" in result and result["products"]:
            product = result["products"][0]
            if "dosage_form" in product and product["dosage_form"]:
                form = product["dosage_form"][0] if isinstance(product["dosage_form"], list) else product["dosage_form"]
        
        # Generate image URL using search query
        image_url = self._generate_image_search_url(name, form)
        
        return {
            "name": name,
            "generic_name": generic_name,
            "description": description,
            "form": form,
            "image_url": image_url
        }

    async def search_medications(
        self, 
        search_term: str, 
        limit: int = 10
    ) -> List[Dict]:
        """
        Search medications in openFDA API by name.
        
        Args:
            search_term: Search term (medication name or active ingredient)
            limit: Maximum number of results (default: 10, max: 100 per openFDA limits)
        
        Returns:
            List of normalized medication dictionaries
        """
        if limit > 100:
            limit = 100  # openFDA limit
        if limit < 1:
            limit = 1
        
        try:
            # Search in brand_name and generic_name fields
            # openFDA uses Lucene query syntax - use wildcard search for better results
            # Remove quotes and use * for partial matching
            search_term_clean = search_term.strip().replace('"', '').replace("'", "")
            search_query = f'search=openfda.brand_name:{search_term_clean}* OR openfda.generic_name:{search_term_clean}* OR openfda.substance_name:{search_term_clean}* OR brand_name:{search_term_clean}*'
            url = f"{self.base_url}?{search_query}&limit={limit}"
            
            logger.info(f"Fetching medications from openFDA: {search_term} -> URL: {url}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                # Log response for debugging
                logger.info(f"openFDA response status: {response.status_code}, results count: {len(data.get('results', []))}")
            
            # Extract results
            results = data.get("results", [])
            normalized_results = []
            
            for result in results:
                try:
                    normalized = self._normalize_openfda_response(result)
                    normalized_results.append(normalized)
                except Exception as e:
                    logger.warning(f"Error normalizing medication result: {e}")
                    continue
            
            logger.info(f"Successfully fetched {len(normalized_results)} medications")
            return normalized_results
            
        except httpx.HTTPError as e:
            logger.error(f"Error fetching from openFDA API: {str(e)}")
            raise Exception(f"Failed to fetch medications from openFDA: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in medications service: {str(e)}")
            raise Exception(f"Medications service error: {str(e)}")

    async def get_medication_by_name(self, name: str) -> Optional[Dict]:
        """
        Get a single medication by exact name match.
        
        Args:
            name: Medication name to search for
        
        Returns:
            Normalized medication dictionary or None if not found
        """
        results = await self.search_medications(name, limit=1)
        if results:
            return results[0]
        return None


# Singleton instance
medications_service = MedicationsService()

