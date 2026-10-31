# Agendo Cyber — Unit Economics

Panel interactivo para analizar el caso B de Agendo: adquisición, retención y caja
de un SaaS de agenda y cobros para barberías.

## Niveles del reto

1. **Calculadora:** compara el caso base, la proyección de Valeria y la respuesta
   histórica al escalar anuncios. Incluye CAC paid y blended, LTV a 24 meses,
   LTV:CAC, payback por cohorte mensual, anual prepago y orgánica, y descarga de
   escenarios en CSV.
2. **Tablero:** modifica inversión, precio, margen bruto y churn con controles
   interactivos. Los trials se estiman mediante interpolación lineal de los datos
   del caso.
3. **Simulador:** proyecta activos, ingresos, gastos y caja durante 24 meses.
   Permite variar la mezcla anual, aplica la renovación del 70 % en el mes 13 y
   limita automáticamente la inversión si el plan amenaza el piso de seguridad.

## Supuestos del modelo

- Plan mensual de USD 25, margen bruto de 78 %, conversión trial a pago de 14 %
  y churn mensual de 6 % como valores iniciales.
- El escenario base modela el 100 % de clientes en el plan mensual. El simulador
  permite cambiar la mezcla anual; los 1.150 clientes activos iniciales se
  consideran mensuales.
- Los clientes nuevos pagan su primer mes al llegar; el churn empieza el mes
  siguiente. Se agregan 50 clientes orgánicos por mes.
- Cada vendedora atiende hasta 500 trials y cuesta USD 1.200 al mes. La comisión
  es USD 20 por cada nuevo cliente de anuncios.
- Los costos fijos son USD 14.000 mensuales; los costos directos de 22 % ya
  están descontados mediante el margen bruto.
- La caja inicial es USD 60.000 y su piso de seguridad es USD 10.000.
- La proyección de Valeria mantiene USD 20 por trial al escalar. La proyección
  histórica usa la interpolación de los puntos de inversión y trials del caso.

## Ejecución local

```sh
npm install
npm run dev
```

Validaciones disponibles:

```sh
npm run lint
npm run build
```
