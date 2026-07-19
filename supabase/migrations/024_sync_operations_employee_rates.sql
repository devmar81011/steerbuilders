-- Employee numbers and individual daily rates from
-- "Sample payroll for operations.xlsx".
--
-- Jhea is set to 550/day because the sheet's 68.75 hourly rate and
-- 1,925 regular pay for 28 hours both calculate from 550, while its
-- displayed daily-rate cell says 600.
with source(employee_number, name, role, rate) as (
  values
    ('9', 'Neil Vincent Danghil', 'Labor', 500.00),
    ('19', 'Jhelbert Padapat', 'Labor', 600.00),
    ('20', 'Johndrel Padapat Labor', 'Labor', 500.00),
    ('26', 'Jumarie Olivo', 'Skilled', 550.00),
    ('27', 'Erwin Padapat', 'Skilled', 650.00),
    ('30', 'Cesar Lauglaug', 'Foreman', 850.00),
    ('31', 'Marcus Llena', 'Skilled', 700.00),
    ('32', 'Jerald Momo', 'Skilled', 650.00),
    ('34', 'Rey Niño Pintor', 'Labor', 550.00),
    ('35', 'Amos Pintor', 'Labor', 550.00),
    ('42', 'Richard Olivo', 'Foreman', 850.00),
    ('44', 'Victor Alano', 'Skilled', 550.00),
    ('47', 'Rodregario Villahermosa', 'Skilled', 800.00),
    ('50', 'Junrey Diaz', 'Skilled', 550.00),
    ('66', 'Jordan Sermon', 'Skilled', 550.00),
    ('76', 'Paterno Canoy', 'Skilled', 550.00),
    ('79', 'Berlin Pintor', 'Labor', 500.00),
    ('92', 'Bernadito Pintor', 'Skilled', 550.00),
    ('107', 'Miko Lucaban', 'Labor', 500.00),
    ('114', 'Edwin Manlakat', 'Skilled', 550.00),
    ('119', 'Carvey Villahermosa', 'Labor', 450.00),
    ('129', 'Christian', 'Labor', 450.00),
    ('132', 'Mark', 'Skilled', 550.00),
    ('135', 'Rollymar', 'Labor', 450.00),
    ('136', 'Benjie Medalla', 'Skilled', 600.00),
    ('137', 'Junjie Escultor', 'Skilled', 600.00),
    ('144', 'Lemuel Cudo', 'Skilled', 600.00),
    ('147', 'Jorey Rio', 'Labor', 450.00),
    ('154', 'Melvin', 'Labor', 450.00),
    ('158', 'Danilo Caparida', 'Skilled', 550.00),
    ('161', 'Lucas', 'Skilled', 600.00),
    ('163', 'Elizabeth Goma', 'Foreman', 800.00),
    ('165', 'Jhea', 'Skilled', 550.00),
    ('171', 'Myeth', 'Labor', 450.00),
    ('172', 'Evelyn', 'Labor', 450.00),
    ('176', 'Belen', 'Labor', 450.00),
    ('177', 'Celio', 'Skilled', 600.00)
)
update public.employees as employee
set employee_number = source.employee_number,
    name = source.name,
    category = 'construction',
    role = source.role,
    rate = source.rate,
    rate_type = 'daily',
    status = 'active'
from source
where employee.employee_number = source.employee_number
   or lower(trim(employee.name)) = lower(trim(source.name));

with source(employee_number, name, role, rate) as (
  values
    ('9', 'Neil Vincent Danghil', 'Labor', 500.00),
    ('19', 'Jhelbert Padapat', 'Labor', 600.00),
    ('20', 'Johndrel Padapat Labor', 'Labor', 500.00),
    ('26', 'Jumarie Olivo', 'Skilled', 550.00),
    ('27', 'Erwin Padapat', 'Skilled', 650.00),
    ('30', 'Cesar Lauglaug', 'Foreman', 850.00),
    ('31', 'Marcus Llena', 'Skilled', 700.00),
    ('32', 'Jerald Momo', 'Skilled', 650.00),
    ('34', 'Rey Niño Pintor', 'Labor', 550.00),
    ('35', 'Amos Pintor', 'Labor', 550.00),
    ('42', 'Richard Olivo', 'Foreman', 850.00),
    ('44', 'Victor Alano', 'Skilled', 550.00),
    ('47', 'Rodregario Villahermosa', 'Skilled', 800.00),
    ('50', 'Junrey Diaz', 'Skilled', 550.00),
    ('66', 'Jordan Sermon', 'Skilled', 550.00),
    ('76', 'Paterno Canoy', 'Skilled', 550.00),
    ('79', 'Berlin Pintor', 'Labor', 500.00),
    ('92', 'Bernadito Pintor', 'Skilled', 550.00),
    ('107', 'Miko Lucaban', 'Labor', 500.00),
    ('114', 'Edwin Manlakat', 'Skilled', 550.00),
    ('119', 'Carvey Villahermosa', 'Labor', 450.00),
    ('129', 'Christian', 'Labor', 450.00),
    ('132', 'Mark', 'Skilled', 550.00),
    ('135', 'Rollymar', 'Labor', 450.00),
    ('136', 'Benjie Medalla', 'Skilled', 600.00),
    ('137', 'Junjie Escultor', 'Skilled', 600.00),
    ('144', 'Lemuel Cudo', 'Skilled', 600.00),
    ('147', 'Jorey Rio', 'Labor', 450.00),
    ('154', 'Melvin', 'Labor', 450.00),
    ('158', 'Danilo Caparida', 'Skilled', 550.00),
    ('161', 'Lucas', 'Skilled', 600.00),
    ('163', 'Elizabeth Goma', 'Foreman', 800.00),
    ('165', 'Jhea', 'Skilled', 550.00),
    ('171', 'Myeth', 'Labor', 450.00),
    ('172', 'Evelyn', 'Labor', 450.00),
    ('176', 'Belen', 'Labor', 450.00),
    ('177', 'Celio', 'Skilled', 600.00)
)
insert into public.employees (
  employee_number,
  name,
  category,
  role,
  rate,
  rate_type,
  status
)
select
  source.employee_number,
  source.name,
  'construction',
  source.role,
  source.rate,
  'daily',
  'active'
from source
where not exists (
  select 1
  from public.employees as employee
  where employee.employee_number = source.employee_number
     or lower(trim(employee.name)) = lower(trim(source.name))
);
