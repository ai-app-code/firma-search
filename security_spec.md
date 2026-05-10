# security_spec.md

## Data Invariants
1. `firms`: Sadece yetkili kullanıcılar veya sistem (admin) tarafından oluşturulabilir.
2. `notes`: Bir firma kaydına bağlı olmalıdır.
3. `tasks`: Arka plan taramaları için sadece "bekliyor", "isleniyor", "tamamlandi" gibi statüleri kabul eder.

## The Dirty Dozen Payloads (Rejection Targets)
1. `firms`: `ownerId` manipülasyonu.
2. `firms`: Dev boyutlu string enjeksiyonu.
3. `tasks`: Geçersiz statü (e.g. `status: 'hacked'`).
4. `notes`: Başka birinin firmasından not okuma denemesi.
... (diğerleri kurallar içinde validasyonla engellenecektir)
