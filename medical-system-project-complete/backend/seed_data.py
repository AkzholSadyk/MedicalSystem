"""
Script to seed the database with test data
"""

import sys
from datetime import date, timedelta

from database import Base, SessionLocal, engine
from models import Appointment, Clinic, Department, Doctor, MedicalRecord, Patient, User
from utils.security import get_password_hash

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    print("🌱 Starting database seeding...")

    # Check if data already exists
    existing_users = db.query(User).count()
    if existing_users > 0:
        print(f"⚠️  Database already has {existing_users} users. Skipping seed.")
        response = input("Do you want to clear and reseed? (yes/no): ")
        if response.lower() != "yes":
            print("Seeding cancelled.")
            sys.exit(0)
        else:
            print("Clearing database...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

    # 1. Create Admin User
    print("Creating admin user...")
    admin_user = User(
        username="Admin123",
        email="admin@medical.com",
        hashed_password=get_password_hash("Admin123"),
        role="admin",
        is_active=True,
    )
    db.add(admin_user)
    db.commit()

    # 2. Create Doctors
    print("Creating doctors...")

    # Doctor 1 - Терапевт
    doctor1_user = User(
        username="elena_smirnova",
        email="elena.smirnova@medical.com",
        hashed_password=get_password_hash("doctor123"),
        role="doctor",
        is_active=True,
    )
    db.add(doctor1_user)
    db.commit()
    db.refresh(doctor1_user)

    doctor1 = Doctor(
        user_id=doctor1_user.id,
        name="Елена Смирнова",
        specialization="Терапевт",
        phone="+7 (912) 345-67-89",
        license_number="MD12345",
        years_of_experience=10,
        education="Первый МГМУ им. И.М. Сеченова",
        bio="Опытный терапевт с 10-летним стажем работы",
        consultation_fee=2000.00,
    )
    db.add(doctor1)

    # Doctor 2 - Кардиолог
    doctor2_user = User(
        username="olga_novikova",
        email="olga.novikova@medical.com",
        hashed_password=get_password_hash("doctor123"),
        role="doctor",
        is_active=True,
    )
    db.add(doctor2_user)
    db.commit()
    db.refresh(doctor2_user)

    doctor2 = Doctor(
        user_id=doctor2_user.id,
        name="Ольга Новикова",
        specialization="Кардиолог",
        phone="+7 (913) 456-78-90",
        license_number="MD23456",
        years_of_experience=15,
        education="РНИМУ им. Н.И. Пирогова",
        bio="Специалист по сердечно-сосудистым заболеваниям",
        consultation_fee=3000.00,
    )
    db.add(doctor2)

    # Doctor 3 - Хирург
    doctor3_user = User(
        username="dmitry_volkov",
        email="dmitry.volkov@medical.com",
        hashed_password=get_password_hash("doctor123"),
        role="doctor",
        is_active=True,
    )
    db.add(doctor3_user)
    db.commit()
    db.refresh(doctor3_user)

    doctor3 = Doctor(
        user_id=doctor3_user.id,
        name="Дмитрий Волков",
        specialization="Хирург",
        phone="+7 (914) 567-89-01",
        license_number="MD34567",
        years_of_experience=12,
        education="МГМСУ им. А.И. Евдокимова",
        bio="Хирург высшей категории",
        consultation_fee=3500.00,
    )
    db.add(doctor3)

    db.commit()
    db.refresh(doctor1)
    db.refresh(doctor2)
    db.refresh(doctor3)

    # 3. Create Patients
    print("Creating patients...")

    # Patient 1
    patient1_user = User(
        username="ivan_petrov",
        email="ivan.petrov@example.com",
        hashed_password=get_password_hash("patient123"),
        role="patient",
        is_active=True,
    )
    db.add(patient1_user)
    db.commit()
    db.refresh(patient1_user)

    patient1 = Patient(
        user_id=patient1_user.id,
        name="Иван Петров",
        phone="+7 (912) 345-67-89",
        date_of_birth=date(1990, 5, 15),
        address="г. Москва, ул. Ленина, д. 10, кв. 25",
        blood_type="A+",
        allergies="Пенициллин",
        emergency_contact="Мария Петрова (жена)",
        emergency_phone="+7 (912) 345-67-90",
    )
    db.add(patient1)

    # Patient 2
    patient2_user = User(
        username="maria_sidorova",
        email="maria.sidorova@example.com",
        hashed_password=get_password_hash("patient123"),
        role="patient",
        is_active=True,
    )
    db.add(patient2_user)
    db.commit()
    db.refresh(patient2_user)

    patient2 = Patient(
        user_id=patient2_user.id,
        name="Мария Сидорова",
        phone="+7 (913) 456-78-90",
        date_of_birth=date(1985, 8, 20),
        address="г. Москва, ул. Пушкина, д. 5, кв. 12",
        blood_type="B+",
        emergency_contact="Александр Сидоров (муж)",
        emergency_phone="+7 (913) 456-78-91",
    )
    db.add(patient2)

    # Patient 3
    patient3_user = User(
        username="alex_kozlov",
        email="alex.kozlov@example.com",
        hashed_password=get_password_hash("patient123"),
        role="patient",
        is_active=True,
    )
    db.add(patient3_user)
    db.commit()
    db.refresh(patient3_user)

    patient3 = Patient(
        user_id=patient3_user.id,
        name="Александр Козлов",
        phone="+7 (914) 567-89-01",
        date_of_birth=date(1978, 12, 10),
        address="г. Москва, пр. Мира, д. 15, кв. 8",
        blood_type="O+",
        allergies="Аспирин",
        emergency_contact="Елена Козлова (мать)",
        emergency_phone="+7 (914) 567-89-02",
    )
    db.add(patient3)

    db.commit()
    db.refresh(patient1)
    db.refresh(patient2)
    db.refresh(patient3)

    # 4. Create Clinics
    print("Creating clinics...")

    clinic1 = Clinic(
        name="Городская поликлиника №1",
        address="г. Москва, ул. Пушкина, д. 5",
        phone="+7 (495) 123-45-67",
        email="clinic1@medical.com",
        working_hours="Пн-Пт: 8:00-20:00, Сб: 9:00-15:00",
        description="Многопрофильная поликлиника с современным оборудованием",
    )
    db.add(clinic1)

    clinic2 = Clinic(
        name="Медицинский центр Здоровье",
        address="г. Москва, ул. Ленина, д. 20",
        phone="+7 (495) 234-56-78",
        email="clinic2@medical.com",
        working_hours="Пн-Вс: 9:00-21:00",
        description="Частный медицинский центр премиум класса",
    )
    db.add(clinic2)

    db.commit()
    db.refresh(clinic1)
    db.refresh(clinic2)

    # 5. Create Departments
    print("Creating departments...")

    dept1 = Department(
        name="Терапевтическое отделение",
        description="Общая терапия и диагностика",
        clinic_id=clinic1.id,
        floor=2,
        phone="+7 (495) 123-45-68",
    )
    db.add(dept1)

    dept2 = Department(
        name="Кардиологическое отделение",
        description="Диагностика и лечение сердечно-сосудистых заболеваний",
        clinic_id=clinic1.id,
        floor=3,
        phone="+7 (495) 123-45-69",
    )
    db.add(dept2)

    db.commit()

    # 6. Create Appointments
    print("Creating appointments...")

    today = date.today()

    # Completed appointment
    appt1 = Appointment(
        patient_id=patient1.id,
        doctor_id=doctor1.id,
        clinic_id=clinic1.id,
        appointment_date=today - timedelta(days=5),
        appointment_time="10:00",
        duration=30,
        status="completed",
        appointment_type="Плановый осмотр",
        notes="Общий осмотр",
    )
    db.add(appt1)

    # Scheduled appointment
    appt2 = Appointment(
        patient_id=patient2.id,
        doctor_id=doctor2.id,
        clinic_id=clinic1.id,
        appointment_date=today + timedelta(days=3),
        appointment_time="14:30",
        duration=30,
        status="scheduled",
        appointment_type="Консультация",
        notes="Консультация кардиолога",
    )
    db.add(appt2)

    # Cancelled appointment
    appt3 = Appointment(
        patient_id=patient3.id,
        doctor_id=doctor3.id,
        clinic_id=clinic2.id,
        appointment_date=today - timedelta(days=2),
        appointment_time="09:00",
        duration=60,
        status="cancelled",
        appointment_type="Консультация",
        notes="Отменено пациентом",
    )
    db.add(appt3)

    # Today's appointment
    appt4 = Appointment(
        patient_id=patient1.id,
        doctor_id=doctor2.id,
        clinic_id=clinic1.id,
        appointment_date=today,
        appointment_time="15:00",
        duration=30,
        status="scheduled",
        appointment_type="Повторный приём",
    )
    db.add(appt4)

    db.commit()
    db.refresh(appt1)

    # 7. Create Medical Records
    print("Creating medical records...")

    record1 = MedicalRecord(
        patient_id=patient1.id,
        doctor_id=doctor1.id,
        appointment_id=appt1.id,
        diagnosis="ОРВИ",
        symptoms="Повышенная температура, кашель, насморк",
        treatment="Постельный режим, обильное питье",
        prescriptions="Парацетамол 500мг 3 раза в день, Амброксол",
        notes="Рекомендован повторный осмотр через 5 дней",
        record_date=today - timedelta(days=5),
    )
    db.add(record1)

    record2 = MedicalRecord(
        patient_id=patient2.id,
        doctor_id=doctor2.id,
        diagnosis="Артериальная гипертензия 1 степени",
        symptoms="Периодические головные боли, повышенное АД",
        treatment="Медикаментозная терапия, диета",
        prescriptions="Эналаприл 10мг 1 раз в день утром",
        test_results="АД: 145/95, ЭКГ: без патологий",
        notes="Контроль АД ежедневно, повторный приём через месяц",
        record_date=today - timedelta(days=20),
    )
    db.add(record2)

    db.commit()

    print("\n✅ Database seeded successfully!")
    print("\n📊 Created:")
    print("   - 1 Admin")
    print("   - 3 Doctors")
    print("   - 1 Pharmacist")
    print("   - 3 Patients")
    print("   - 2 Clinics")
    print("   - 2 Departments")
    print("   - 4 Appointments")
    print("   - 2 Medical Records")

    print("\n👤 Test Users:")
    print("   Admin:    username: admin,          password: admin123")
    print("   Doctor 1: username: elena_smirnova, password: doctor123")
    print("   Doctor 2: username: olga_novikova,  password: doctor123")
    print("   Doctor 3: username: dmitry_volkov,  password: doctor123")
    print("   Patient 1: username: ivan_petrov,   password: patient123")
    print("   Patient 2: username: maria_sidorova, password: patient123")
    print("   Patient 3: username: alex_kozlov,   password: patient123")

    # Create a Pharmacist user and a sample medication
    print("Creating pharmacist and sample medication...")
    pharmacist_user = User(
        username="pharma_anna",
        email="anna.pharma@example.com",
        hashed_password=get_password_hash("pharma123"),
        role="pharmacist",
        is_active=True,
    )
    db.add(pharmacist_user)
    db.commit()
    db.refresh(pharmacist_user)

    try:
        from models import Medication

        sample_med = Medication(
            name="Aspirin",
            generic_name="Acetylsalicylic acid",
            description="Common analgesic and antiplatelet",
            form="tablet",
            image_url=None,
            stored_image=None,
            created_by=pharmacist_user.id,
        )
        db.add(sample_med)
        db.commit()
    except Exception:
        db.rollback()

except Exception as e:
    print(f"\n❌ Error seeding database: {str(e)}")
    db.rollback()
    raise
finally:
    db.close()
