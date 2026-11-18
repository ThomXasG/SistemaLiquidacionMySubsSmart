import React from 'react';
import { BookOpen, ShieldCheck, Scale, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';

export default function LegalGuide() {
  const articles = [
    {
      number: "Artículo 169",
      title: "Causas para la terminación del contrato individual de trabajo",
      content: "El contrato de trabajo termina: 1. Por las causas legalmente previstas en el contrato; 2. Por acuerdo de las partes; 3. Por la conclusión de la obra, período de labor o servicios objeto del contrato; 4. Por muerte o incapacidad del empleador o extinción de la persona jurídica contratante; 5. Por muerte del trabajador o incapacidad permanente y total; 6. Por caso fortuito o fuerza mayor; 7. Por voluntad del empleador en los casos del artículo 172 (visto bueno); 8. Por voluntad del trabajador según el artículo 173 (visto bueno); 9. Por desahucio presentado por el trabajador o el empleador.",
      tag: "Terminación"
    },
    {
      number: "Artículo 185",
      title: "Bonificación por desahucio",
      content: "En los casos de terminación de la relación laboral por desahucio, el empleador bonificará al trabajador con el veinticinco por ciento (25%) del equivalente a la última remuneración mensual por cada uno de los años de servicio prestados a la misma empresa o empleador. Dicha bonificación se concederá en todos los casos de desahucio voluntario del trabajador o empleador.",
      formula: "25% × Última Remuneración × Años completos de servicio",
      tag: "Beneficio"
    },
    {
      number: "Artículo 188",
      title: "Indemnización por despido intempestivo",
      content: "El empleador que despidiere intempestivamente al trabajador será condenado a indemnizarle, de conformidad con el tiempo de servicio: Hasta tres años de servicio, con el valor correspondiente a tres meses de remuneración; y, de más de tres años, con el equivalente a un mes de remuneración por cada año de servicio o fracción, el mismo que no podrá exceder de veinticinco meses de remuneración.",
      formula: "Hasta 3 años = 3 meses de sueldo; Más de 3 años = 1 mes por cada año o fracción",
      tag: "Indemnización"
    },
    {
      number: "Artículo 111",
      title: "Derecho a la décima tercera remuneración (Bono Navideño)",
      content: "Los trabajadores tienen derecho a que sus empleadores les paguen mensualmente, la parte proporcional a la doceava parte de las remuneraciones que perciban durante el año calendario. Para efectos del cálculo en liquidación, el período comprende desde el 1 de diciembre del año anterior hasta el 30 de noviembre del año en curso.",
      formula: "(Sueldo mensual × Días laborados en el período 1 Dic a 30 Nov) / 360 días",
      tag: "Beneficio Anual"
    },
    {
      number: "Artículo 113",
      title: "Derecho a la décima cuarta remuneración (Bono Escolar)",
      content: "Los trabajadores percibirán, además, sin perjuicio de todas las remuneraciones a las que actualmente tienen derecho, una bonificación anual equivalente a una remuneración básica unificada vigente a la fecha de pago (SBU). Períodos de cómputo: Región Sierra y Amazonía: del 1 de agosto al 31 de julio del año siguiente; Región Costa e Insular: del 1 de marzo al último día de febrero del año siguiente.",
      formula: "(Salario Básico Unificado × Días del ciclo escolar) / 360 días",
      tag: "Beneficio Anual"
    },
    {
      number: "Artículos 69 y 71",
      title: "Vacaciones anuales y liquidación por terminación",
      content: "Todo trabajador tiene derecho a gozar anualmente de un período ininterrumpido de quince días de descanso. Quienes hubieren prestado servicios por más de cinco años en la misma empresa tendrán derecho a un día adicional por cada año excedente. Cuando el trabajador termine su relación sin haber gozado de vacaciones, percibirá el valor en dinero proporcional al tiempo servido.",
      formula: "Días pendientes × (Remuneración mensual / 30)",
      tag: "Descanso y Liquidación"
    },
    {
      number: "Artículo 196",
      title: "Fondos de reserva",
      content: "Todo trabajador que preste servicios por más de un año tiene derecho a que el empleador le abone una suma equivalente a un mes de sueldo o salario por cada año completo posterior al primero (8.33% mensual). Este valor se entrega al Instituto Ecuatoriano de Seguridad Social (IESS) o directamente al trabajador mensualizado.",
      formula: "8.33% de la remuneración mensual a partir del mes 13 de labores",
      tag: "Seguridad Social"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <Scale className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Normativa y Código del Trabajo de Ecuador</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Marco legal regulatorio que rige el cálculo de liquidaciones, desvinculaciones y paz y salvo empresarial.
          </p>
        </div>
      </div>

      {/* Distinction Callout */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Diferencia Jurídica: Paz y Salvo Interno vs. Acta de Finiquito Legal</span>
        </div>
        <p className="text-xs leading-relaxed">
          <b>Importante:</b> El <b>Certificado de Paz y Salvo</b> es un instrumento administrativo y de control interno de la empresa que valida que el trabajador no mantiene deudas, bienes ni pendientes con ningún departamento (TI, Bodega, RRHH, etc.). Por su parte, el <b>Acta de Finiquito</b> es el documento legal suscrito conforme a las formalidades del Ministerio del Trabajo (a través del sistema SUT), cuyo pago y registro legaliza la culminación de la relación laboral ante las autoridades competentes.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="space-y-4">
        {articles.map((art, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {art.number}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-2">{art.title}</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                {art.tag}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed text-justify">
              {art.content}
            </p>

            {art.formula && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-blue-900 font-mono flex items-center gap-2">
                <span className="font-bold text-slate-500">Fórmula de Ley:</span>
                <span>{art.formula}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

