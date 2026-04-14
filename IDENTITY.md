# 🆔 Project Identity: Beauty Platform (SkinSystem)

## Project Summary
SaaS multi-tenant premium para la gestión de citas de estética y peluquería. 
Diseñado para la independencia operativa de especialistas individuales (Lourdes y Gloria) con proyección a una identidad unificada en local físico.

## Stakeholders
- **Lourdes:** Especialista en Estética Facial y Salud de la Piel.
- **Gloria:** Experta Colorista, Maquillaje y Novias (Glowding).

## Core Values
- **Exclusividad:** Catálogos y agendas 100% aislados por subdominio.
- **Minimalismo:** Estética editorial, limpia y de lujo.
- **Trazabilidad:** Seguimiento clínico/técnico de cada servicio mediante PDFs.

## Roles y Permisos
- **Owner (Lourdes/Gloria)**: 
  - Full access (Stripe Configuration, Billing, Analytics, Staff Management).
  - Only role with permission to view financial reports.
- **Staff (Future employees)**: 
  - Access to Schedule, Customer Records and Data Upload.
  - **Total Block**: Cannot view Stripe keys or total organization income.