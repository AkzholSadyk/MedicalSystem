import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService, TranslationChangeEvent } from '@ngx-translate/core';

@Injectable()
export class TranslateMatPaginatorIntl extends MatPaginatorIntl {
  constructor(private translate: TranslateService) {
    super();
    this.getAndInitTranslations();
    this.translate.onLangChange.subscribe(() => this.getAndInitTranslations());
  }

  getAndInitTranslations() {
    this.translate.get(['PAGINATOR.ITEMS_PER_PAGE', 'PAGINATOR.NEXT_PAGE', 'PAGINATOR.PREVIOUS_PAGE', 'PAGINATOR.RANGE']).subscribe(translations => {
      this.itemsPerPageLabel = translations['PAGINATOR.ITEMS_PER_PAGE'] || 'Items per page';
      this.nextPageLabel = translations['PAGINATOR.NEXT_PAGE'] || 'Next page';
      this.previousPageLabel = translations['PAGINATOR.PREVIOUS_PAGE'] || 'Previous page';
      this.changes.next();
    });
  }

  // Optional: rangeLabel customization if needed
  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return this.translate.instant('PAGINATOR.RANGE', { start: 0, end: 0, length });
    }
    const startIndex = page * pageSize + 1;
    const endIndex = Math.min(length, (page + 1) * pageSize);
    return this.translate.instant('PAGINATOR.RANGE', { start: startIndex, end: endIndex, length });
  };
}
