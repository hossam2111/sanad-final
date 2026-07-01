export type InteractionSeverity = "low" | "moderate" | "high" | "critical";

export interface InteractionWarning {
  severity: InteractionSeverity;
  conflictingDrug: string;
  description: string;
  recommendation: string;
}

const INTERACTION_DATABASE: Record<string, Array<{
  drug: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
}>> = {
  warfarin: [
    { drug: "aspirin", severity: "high", description: "Increased bleeding risk when combined with anticoagulants.", recommendation: "Avoid combination or monitor INR closely." },
    { drug: "ibuprofen", severity: "high", description: "NSAIDs increase anticoagulant effect and GI bleeding risk.", recommendation: "Use paracetamol instead. If NSAID necessary, monitor INR." },
    { drug: "naproxen", severity: "high", description: "NSAIDs increase anticoagulant effect and GI bleeding risk.", recommendation: "Use paracetamol instead." },
    { drug: "amiodarone", severity: "critical", description: "Amiodarone significantly potentiates warfarin — can cause life-threatening bleeding.", recommendation: "Reduce warfarin dose by 30-50%. Monitor INR every 3-5 days." },
    { drug: "clarithromycin", severity: "high", description: "Antibiotic inhibits warfarin metabolism, increasing INR.", recommendation: "Monitor INR closely. Adjust warfarin dose as needed." },
    { drug: "ciprofloxacin", severity: "moderate", description: "May enhance anticoagulant effect of warfarin.", recommendation: "Monitor INR every few days during antibiotic course." },
    { drug: "metronidazole", severity: "high", description: "Significantly enhances anticoagulant effect of warfarin.", recommendation: "Reduce warfarin dose. Monitor INR closely." },
  ],
  aspirin: [
    { drug: "warfarin", severity: "high", description: "Combined use substantially increases bleeding risk.", recommendation: "Avoid unless benefit clearly outweighs risk. Monitor closely." },
    { drug: "clopidogrel", severity: "moderate", description: "Dual antiplatelet therapy increases bleeding risk.", recommendation: "Only combine if clearly indicated (e.g., ACS). Monitor for bleeding." },
    { drug: "ibuprofen", severity: "moderate", description: "Ibuprofen may block cardioprotective effect of low-dose aspirin.", recommendation: "Take aspirin at least 2 hours before ibuprofen." },
    { drug: "methotrexate", severity: "critical", description: "Aspirin reduces renal clearance of methotrexate, causing toxicity.", recommendation: "Avoid combination. Use alternative analgesics." },
    { drug: "heparin", severity: "high", description: "Additive anticoagulation and antiplatelet effects increase hemorrhage risk.", recommendation: "Avoid unless post-cardiac stenting. Monitor bleeding parameters." },
  ],
  metformin: [
    { drug: "contrast media", severity: "critical", description: "Iodinated contrast can cause acute kidney injury and metformin-associated lactic acidosis.", recommendation: "Hold metformin 48h before and after contrast procedures." },
    { drug: "alcohol", severity: "moderate", description: "Alcohol increases risk of lactic acidosis with metformin.", recommendation: "Advise patient to avoid heavy alcohol consumption." },
    { drug: "cimetidine", severity: "moderate", description: "Cimetidine reduces renal tubular secretion of metformin, increasing levels.", recommendation: "Monitor blood glucose. Consider dose adjustment." },
  ],
  lisinopril: [
    { drug: "potassium", severity: "moderate", description: "ACE inhibitors increase potassium retention; additive with potassium supplements.", recommendation: "Monitor serum potassium. Avoid high-potassium diet." },
    { drug: "spironolactone", severity: "high", description: "Combined use may cause dangerous hyperkalemia.", recommendation: "Monitor potassium closely. Consider dose reduction." },
    { drug: "nsaids", severity: "moderate", description: "NSAIDs reduce antihypertensive effect and risk of acute kidney injury.", recommendation: "Avoid NSAIDs if possible. Monitor blood pressure and renal function." },
    { drug: "ibuprofen", severity: "moderate", description: "NSAIDs reduce antihypertensive effect and risk of acute kidney injury.", recommendation: "Avoid NSAIDs if possible. Monitor blood pressure and renal function." },
    { drug: "aliskiren", severity: "critical", description: "Dual renin-angiotensin blockade causes hypotension, hyperkalemia, renal impairment.", recommendation: "Combination contraindicated in patients with diabetes or renal impairment." },
  ],
  simvastatin: [
    { drug: "amiodarone", severity: "high", description: "Amiodarone inhibits metabolism of simvastatin, increasing myopathy risk.", recommendation: "Limit simvastatin to 20mg/day or switch to pravastatin." },
    { drug: "clarithromycin", severity: "critical", description: "Strong CYP3A4 inhibitor markedly increases simvastatin levels — risk of rhabdomyolysis.", recommendation: "Temporarily hold simvastatin during clarithromycin course." },
    { drug: "diltiazem", severity: "high", description: "Diltiazem inhibits CYP3A4 metabolism of simvastatin.", recommendation: "Limit simvastatin to 10mg/day. Consider alternative statin." },
    { drug: "amlodipine", severity: "moderate", description: "Slightly increases simvastatin exposure. Risk of myopathy.", recommendation: "Limit simvastatin to 20mg/day." },
  ],
  amiodarone: [
    { drug: "warfarin", severity: "critical", description: "Significantly potentiates warfarin anticoagulation. Life-threatening bleeding risk.", recommendation: "Reduce warfarin dose by 30-50%. Monitor INR every 3-5 days." },
    { drug: "simvastatin", severity: "high", description: "Amiodarone inhibits statin metabolism, increasing myopathy risk.", recommendation: "Limit simvastatin to 20mg/day or switch to pravastatin." },
    { drug: "digoxin", severity: "high", description: "Amiodarone increases digoxin levels by ~70%, risking toxicity.", recommendation: "Reduce digoxin dose by 50%. Monitor digoxin levels." },
    { drug: "metoprolol", severity: "high", description: "Additive negative chronotropic and dromotropic effects. Risk of bradycardia/heart block.", recommendation: "Monitor heart rate and ECG closely." },
  ],
  metoprolol: [
    { drug: "verapamil", severity: "critical", description: "Combined AV node blockade can cause severe bradycardia and complete heart block.", recommendation: "Avoid combination. If necessary, monitor ECG continuously." },
    { drug: "diltiazem", severity: "high", description: "Additive AV node suppression. Risk of bradycardia and heart block.", recommendation: "Monitor heart rate and ECG. Use lowest effective doses." },
    { drug: "clonidine", severity: "high", description: "Rebound hypertension on clonidine withdrawal is worsened by beta-blocker.", recommendation: "Withdraw beta-blocker several days before stopping clonidine." },
    { drug: "amiodarone", severity: "high", description: "Additive bradycardia and conduction block.", recommendation: "Monitor ECG and heart rate closely." },
  ],
  clopidogrel: [
    { drug: "omeprazole", severity: "moderate", description: "Omeprazole inhibits CYP2C19, reducing clopidogrel to active metabolite conversion.", recommendation: "Use pantoprazole instead if PPI needed." },
    { drug: "aspirin", severity: "moderate", description: "Dual antiplatelet therapy increases bleeding risk.", recommendation: "Only combine if clearly indicated. Monitor for bleeding signs." },
    { drug: "warfarin", severity: "high", description: "Triple therapy (warfarin + dual antiplatelet) markedly increases bleeding risk.", recommendation: "Minimize duration of triple therapy. Use GI protection." },
  ],
  ssri: [
    { drug: "tramadol", severity: "critical", description: "Risk of serotonin syndrome: hyperthermia, agitation, seizures.", recommendation: "Avoid combination. Use alternative analgesic." },
    { drug: "maoi", severity: "critical", description: "Life-threatening serotonin syndrome.", recommendation: "Contraindicated. Allow 14-day washout between agents." },
    { drug: "triptans", severity: "high", description: "Risk of serotonin syndrome.", recommendation: "Use with caution; monitor for serotonin toxicity signs." },
  ],
  fluoxetine: [
    { drug: "tramadol", severity: "critical", description: "Risk of serotonin syndrome and seizures.", recommendation: "Avoid combination. Use alternative analgesic." },
    { drug: "maoi", severity: "critical", description: "Life-threatening serotonin syndrome — requires 5-week washout after stopping fluoxetine.", recommendation: "Contraindicated. Observe washout period." },
    { drug: "codeine", severity: "moderate", description: "Fluoxetine inhibits CYP2D6, reducing conversion of codeine to morphine — loss of efficacy.", recommendation: "Consider alternative analgesic." },
  ],
  ciprofloxacin: [
    { drug: "warfarin", severity: "moderate", description: "May enhance anticoagulant effect of warfarin.", recommendation: "Monitor INR during antibiotic course." },
    { drug: "tizanidine", severity: "critical", description: "Ciprofloxacin dramatically increases tizanidine levels — severe hypotension, sedation.", recommendation: "Contraindicated combination." },
    { drug: "theophylline", severity: "high", description: "Ciprofloxacin inhibits theophylline metabolism — risk of toxicity (seizures, arrhythmias).", recommendation: "Reduce theophylline dose by 50%. Monitor theophylline levels." },
    { drug: "antacids", severity: "moderate", description: "Antacids reduce ciprofloxacin absorption.", recommendation: "Take ciprofloxacin 2 hours before or 6 hours after antacids." },
  ],

  // ── Anticoagulants ──────────────────────────────────────────────────────────
  heparin: [
    { drug: "aspirin", severity: "high", description: "Additive anticoagulation and antiplatelet effects increase hemorrhage risk.", recommendation: "Avoid unless post-cardiac stenting. Monitor bleeding parameters." },
    { drug: "clopidogrel", severity: "high", description: "Combined antiplatelet + anticoagulant therapy markedly raises bleeding risk.", recommendation: "Use only when clearly indicated (ACS). Monitor closely." },
    { drug: "warfarin", severity: "high", description: "Additive anticoagulant effect — unintended supratherapeutic anticoagulation.", recommendation: "Transition protocols require careful INR monitoring. Do not overlap without plan." },
    { drug: "ibuprofen", severity: "high", description: "NSAIDs increase GI bleeding risk in anticoagulated patients.", recommendation: "Use paracetamol for analgesia. Avoid NSAIDs." },
  ],
  dabigatran: [
    { drug: "amiodarone", severity: "high", description: "Amiodarone inhibits P-glycoprotein, increasing dabigatran plasma levels and bleeding risk.", recommendation: "Reduce dabigatran dose. Monitor for bleeding signs." },
    { drug: "aspirin", severity: "high", description: "Combined use increases bleeding risk significantly.", recommendation: "Avoid unless indicated for dual therapy (ACS). Use GI protection." },
    { drug: "clarithromycin", severity: "high", description: "P-gp inhibitor increases dabigatran exposure by ~15-20%.", recommendation: "Monitor for bleeding. Consider dose reduction." },
    { drug: "rifampicin", severity: "high", description: "P-gp inducer markedly reduces dabigatran levels — loss of anticoagulation.", recommendation: "Avoid combination. Consider alternative anticoagulant." },
  ],
  rivaroxaban: [
    { drug: "clarithromycin", severity: "high", description: "Combined CYP3A4/P-gp inhibition increases rivaroxaban levels, raising bleeding risk.", recommendation: "Monitor for bleeding. Short courses usually acceptable." },
    { drug: "itraconazole", severity: "critical", description: "Strong CYP3A4/P-gp inhibitor markedly increases rivaroxaban — potentially fatal bleeding.", recommendation: "Contraindicated combination." },
    { drug: "rifampicin", severity: "critical", description: "Strong CYP3A4/P-gp inducer reduces rivaroxaban by ~50% — loss of efficacy.", recommendation: "Avoid combination. Risk of stroke/thrombosis." },
    { drug: "aspirin", severity: "moderate", description: "Additive antiplatelet effect increases bleeding risk.", recommendation: "Use with caution. Assess risk/benefit. Add GI protection." },
  ],

  // ── Cardiac ─────────────────────────────────────────────────────────────────
  digoxin: [
    { drug: "amiodarone", severity: "high", description: "Amiodarone increases digoxin levels by ~70% via P-gp inhibition — toxicity risk.", recommendation: "Reduce digoxin dose by 50%. Monitor digoxin levels and ECG." },
    { drug: "verapamil", severity: "high", description: "Verapamil increases digoxin levels and has additive AV node depression.", recommendation: "Reduce digoxin dose. Monitor ECG. Avoid in severe AV block." },
    { drug: "clarithromycin", severity: "high", description: "P-gp inhibitor increases digoxin absorption and reduces renal clearance.", recommendation: "Monitor digoxin levels. Consider dose reduction." },
    { drug: "spironolactone", severity: "moderate", description: "Spironolactone may falsely elevate digoxin assay results and alter renal clearance.", recommendation: "Interpret digoxin levels cautiously. Monitor for toxicity signs." },
    { drug: "furosemide", severity: "moderate", description: "Diuretic-induced hypokalemia potentiates digoxin toxicity.", recommendation: "Monitor electrolytes. Maintain K⁺ > 3.5 mmol/L." },
  ],
  verapamil: [
    { drug: "metoprolol", severity: "critical", description: "Combined AV node blockade — severe bradycardia and complete heart block.", recommendation: "Avoid IV verapamil in patients on beta-blockers. Contraindicated IV." },
    { drug: "digoxin", severity: "high", description: "Additive AV node suppression and increased digoxin levels.", recommendation: "Monitor ECG and digoxin levels. Reduce digoxin dose." },
    { drug: "simvastatin", severity: "high", description: "CYP3A4 inhibition increases simvastatin exposure — myopathy risk.", recommendation: "Limit simvastatin to 10mg/day. Consider pravastatin instead." },
    { drug: "carbamazepine", severity: "moderate", description: "CYP3A4 induction reduces verapamil levels — loss of antihypertensive effect.", recommendation: "Monitor blood pressure. May need dose increase." },
    { drug: "rifampicin", severity: "high", description: "Rifampicin markedly reduces verapamil levels — loss of efficacy.", recommendation: "Avoid combination or use alternative calcium channel blocker." },
  ],
  diltiazem: [
    { drug: "metoprolol", severity: "high", description: "Additive AV node suppression — bradycardia and heart block.", recommendation: "Monitor heart rate and ECG. Use lowest effective doses." },
    { drug: "simvastatin", severity: "high", description: "CYP3A4 inhibition — increased simvastatin levels, myopathy risk.", recommendation: "Limit simvastatin to 10mg/day or switch to pravastatin." },
    { drug: "digoxin", severity: "moderate", description: "May increase digoxin levels via P-gp inhibition.", recommendation: "Monitor digoxin levels when starting or stopping diltiazem." },
    { drug: "carbamazepine", severity: "moderate", description: "Diltiazem inhibits carbamazepine metabolism, increasing toxicity risk.", recommendation: "Monitor carbamazepine levels. Reduce dose if signs of toxicity." },
  ],
  furosemide: [
    { drug: "digoxin", severity: "moderate", description: "Diuretic-induced hypokalemia potentiates digoxin toxicity (arrhythmias).", recommendation: "Monitor electrolytes. Keep K⁺ > 3.5 mmol/L. Consider potassium supplementation." },
    { drug: "lithium", severity: "high", description: "Loop diuretics reduce renal lithium clearance — lithium toxicity risk.", recommendation: "Monitor lithium levels closely. Patient should maintain adequate salt intake." },
    { drug: "aminoglycosides", severity: "high", description: "Additive ototoxicity — permanent hearing loss risk.", recommendation: "Avoid combination if possible. Monitor hearing if unavoidable." },
    { drug: "nsaids", severity: "moderate", description: "NSAIDs blunt diuretic response and worsen renal function.", recommendation: "Avoid NSAIDs in patients on diuretics. Use paracetamol." },
    { drug: "ibuprofen", severity: "moderate", description: "Reduces furosemide efficacy and increases risk of acute kidney injury.", recommendation: "Avoid combination. Use paracetamol for analgesia." },
  ],
  spironolactone: [
    { drug: "lisinopril", severity: "high", description: "ACE inhibitor + potassium-sparing diuretic — risk of dangerous hyperkalemia.", recommendation: "Monitor potassium closely every 1-2 weeks initially. Avoid if K⁺ > 5.0." },
    { drug: "potassium", severity: "high", description: "Additive hyperkalemia risk — can cause fatal cardiac arrhythmias.", recommendation: "Avoid routine potassium supplementation. Monitor K⁺ regularly." },
    { drug: "digoxin", severity: "moderate", description: "Spironolactone may interfere with digoxin assay and alter clearance.", recommendation: "Use RIA assay for digoxin if available. Monitor clinically." },
    { drug: "nsaids", severity: "moderate", description: "NSAIDs reduce spironolactone efficacy and worsen renal function.", recommendation: "Avoid NSAIDs. Monitor renal function if unavoidable." },
  ],

  // ── Statins ──────────────────────────────────────────────────────────────────
  atorvastatin: [
    { drug: "clarithromycin", severity: "high", description: "CYP3A4 inhibition significantly increases atorvastatin levels — myopathy and rhabdomyolysis risk.", recommendation: "Use lowest atorvastatin dose or temporarily hold. Use azithromycin as alternative." },
    { drug: "itraconazole", severity: "critical", description: "Potent CYP3A4 inhibitor — markedly increases atorvastatin. High rhabdomyolysis risk.", recommendation: "Avoid combination. Switch to fluvastatin or rosuvastatin." },
    { drug: "rifampicin", severity: "high", description: "CYP3A4/P-gp induction reduces atorvastatin levels by >80% — loss of lipid-lowering effect.", recommendation: "Monitor lipid profile. Increase atorvastatin dose or switch statin." },
    { drug: "amiodarone", severity: "moderate", description: "May increase atorvastatin exposure via P-gp inhibition.", recommendation: "Monitor for myalgia. Limit atorvastatin dose." },
    { drug: "cyclosporine", severity: "critical", description: "CYP3A4/P-gp inhibition drastically increases atorvastatin — rhabdomyolysis.", recommendation: "Contraindicated. Use pravastatin or rosuvastatin at lowest dose." },
  ],

  // ── Antibiotics ──────────────────────────────────────────────────────────────
  clarithromycin: [
    { drug: "warfarin", severity: "high", description: "CYP3A4 inhibition increases warfarin levels — INR elevation, bleeding risk.", recommendation: "Monitor INR closely during and after course. Adjust warfarin dose." },
    { drug: "simvastatin", severity: "critical", description: "Markedly raises simvastatin levels — rhabdomyolysis risk.", recommendation: "Hold simvastatin during clarithromycin course." },
    { drug: "atorvastatin", severity: "high", description: "Significant CYP3A4 inhibition raises atorvastatin levels.", recommendation: "Temporarily hold or reduce atorvastatin. Resume after course." },
    { drug: "digoxin", severity: "high", description: "P-gp inhibition increases digoxin absorption and reduces clearance.", recommendation: "Monitor digoxin levels and ECG during antibiotic course." },
    { drug: "carbamazepine", severity: "high", description: "CYP3A4 inhibition increases carbamazepine — toxicity (diplopia, ataxia, nausea).", recommendation: "Monitor carbamazepine levels. Reduce dose if needed." },
    { drug: "colchicine", severity: "critical", description: "P-gp/CYP3A4 inhibition dramatically increases colchicine — life-threatening toxicity.", recommendation: "Contraindicated in renal impairment. Reduce colchicine dose in normal renal function." },
  ],
  rifampicin: [
    { drug: "warfarin", severity: "critical", description: "Potent CYP450 inducer reduces warfarin levels by up to 90% — stroke or clot risk.", recommendation: "INR may drop within days. Monitor INR daily when starting/stopping. Major dose adjustment needed." },
    { drug: "oral contraceptives", severity: "critical", description: "CYP3A4 induction reduces contraceptive efficacy — unintended pregnancy.", recommendation: "Use barrier contraception during and for 28 days after rifampicin." },
    { drug: "verapamil", severity: "high", description: "Reduces verapamil AUC by >90% — loss of antihypertensive and antiarrhythmic effect.", recommendation: "Avoid combination. Use alternative antihypertensive." },
    { drug: "dabigatran", severity: "high", description: "P-gp induction reduces dabigatran levels — loss of anticoagulation.", recommendation: "Avoid combination. Risk of stroke/DVT." },
    { drug: "rivaroxaban", severity: "critical", description: "Reduces rivaroxaban by ~50% via CYP3A4/P-gp induction.", recommendation: "Avoid. Alternative anticoagulant required." },
    { drug: "tacrolimus", severity: "critical", description: "CYP3A4 induction reduces tacrolimus levels by >80% — transplant rejection risk.", recommendation: "Intensive tacrolimus level monitoring. Dose increases of 3-5× may be required." },
  ],
  metronidazole: [
    { drug: "warfarin", severity: "high", description: "Inhibits CYP2C9 — significantly enhances warfarin anticoagulation.", recommendation: "Reduce warfarin dose by ~25-50%. Monitor INR every 2-3 days." },
    { drug: "alcohol", severity: "high", description: "Disulfiram-like reaction — flushing, nausea, vomiting, tachycardia.", recommendation: "Advise patient to avoid ALL alcohol during treatment and for 48h after completion." },
    { drug: "lithium", severity: "moderate", description: "May increase lithium levels by reducing renal clearance.", recommendation: "Monitor lithium levels during metronidazole course." },
  ],

  // ── Antiepileptics ───────────────────────────────────────────────────────────
  carbamazepine: [
    { drug: "clarithromycin", severity: "high", description: "CYP3A4 inhibition raises carbamazepine to toxic levels — ataxia, diplopia, vomiting.", recommendation: "Monitor carbamazepine levels. Avoid if possible; use azithromycin." },
    { drug: "verapamil", severity: "moderate", description: "Verapamil inhibits carbamazepine metabolism — toxicity risk.", recommendation: "Monitor carbamazepine levels. Use amlodipine as alternative." },
    { drug: "warfarin", severity: "high", description: "CYP3A4 induction reduces warfarin effect — thrombosis risk.", recommendation: "Monitor INR closely. Warfarin dose may need significant increase." },
    { drug: "oral contraceptives", severity: "high", description: "CYP3A4 induction reduces contraceptive hormone levels — contraceptive failure.", recommendation: "Use barrier methods or higher-dose contraceptive. Advise patient." },
    { drug: "lithium", severity: "moderate", description: "Additive neurotoxicity risk (tremor, confusion) even with normal drug levels.", recommendation: "Monitor for neurotoxicity signs. Check both drug levels." },
  ],
  phenytoin: [
    { drug: "warfarin", severity: "high", description: "Complex bidirectional interaction — initially potentiates then reduces warfarin effect.", recommendation: "Monitor INR frequently when starting or stopping phenytoin." },
    { drug: "fluoxetine", severity: "moderate", description: "Fluoxetine inhibits phenytoin metabolism — toxicity risk.", recommendation: "Monitor phenytoin levels. Reduce dose if signs of toxicity appear." },
    { drug: "rifampicin", severity: "high", description: "Rifampicin induces phenytoin metabolism — loss of seizure control.", recommendation: "Monitor phenytoin levels closely. May need significant dose increase." },
    { drug: "oral contraceptives", severity: "high", description: "CYP3A4 induction reduces contraceptive efficacy.", recommendation: "Use non-hormonal or barrier contraception." },
    { drug: "omeprazole", severity: "moderate", description: "Omeprazole inhibits CYP2C19 — may increase phenytoin levels.", recommendation: "Monitor phenytoin levels. Use pantoprazole as alternative." },
  ],

  // ── Psychiatric ──────────────────────────────────────────────────────────────
  lithium: [
    { drug: "ibuprofen", severity: "high", description: "NSAIDs reduce renal lithium clearance — lithium toxicity (tremor, confusion, nausea).", recommendation: "Avoid NSAIDs. Use paracetamol for analgesia." },
    { drug: "naproxen", severity: "high", description: "NSAID-induced reduction in renal lithium clearance — toxicity risk.", recommendation: "Avoid. Use paracetamol instead." },
    { drug: "furosemide", severity: "high", description: "Loop diuretics reduce lithium clearance — toxicity.", recommendation: "Monitor lithium levels closely. Maintain adequate sodium intake." },
    { drug: "lisinopril", severity: "high", description: "ACE inhibitors reduce lithium clearance — toxicity risk.", recommendation: "Monitor lithium levels weekly when ACE inhibitor added." },
    { drug: "metronidazole", severity: "moderate", description: "May increase lithium levels via reduced renal clearance.", recommendation: "Monitor lithium levels during course." },
    { drug: "carbamazepine", severity: "moderate", description: "Additive neurotoxicity despite normal levels — tremor, ataxia.", recommendation: "Monitor neurological status. Levels may not reflect toxicity." },
  ],
  tramadol: [
    { drug: "fluoxetine", severity: "critical", description: "Serotonin syndrome and reduced tramadol analgesic efficacy via CYP2D6 inhibition.", recommendation: "Avoid combination. Use alternative analgesic (paracetamol, NSAIDs if appropriate)." },
    { drug: "ssri", severity: "critical", description: "Serotonin syndrome risk — hyperthermia, agitation, clonus, seizures.", recommendation: "Avoid. Use non-serotonergic analgesic." },
    { drug: "maoi", severity: "critical", description: "Life-threatening serotonin syndrome.", recommendation: "Absolutely contraindicated. Allow 14-day washout after MAOIs." },
    { drug: "carbamazepine", severity: "moderate", description: "Carbamazepine induces tramadol metabolism — reduced analgesia and increased seizure risk.", recommendation: "Use alternative analgesic. Avoid combination." },
  ],

  // ── PPIs ─────────────────────────────────────────────────────────────────────
  omeprazole: [
    { drug: "clopidogrel", severity: "moderate", description: "CYP2C19 inhibition reduces clopidogrel activation — reduced antiplatelet effect.", recommendation: "Switch to pantoprazole or rabeprazole if PPI needed." },
    { drug: "phenytoin", severity: "moderate", description: "CYP2C19 inhibition may increase phenytoin levels — toxicity risk.", recommendation: "Monitor phenytoin levels. Consider pantoprazole." },
    { drug: "methotrexate", severity: "moderate", description: "Proton pump inhibitors may reduce renal methotrexate excretion.", recommendation: "Monitor methotrexate levels and toxicity signs, especially with high-dose therapy." },
  ],

  // ── Immunosuppressants ───────────────────────────────────────────────────────
  cyclosporine: [
    { drug: "clarithromycin", severity: "critical", description: "CYP3A4/P-gp inhibition increases cyclosporine levels by 2-3× — nephrotoxicity and toxicity.", recommendation: "Monitor cyclosporine levels daily. Dose reduction required. Use azithromycin if possible." },
    { drug: "rifampicin", severity: "critical", description: "CYP3A4/P-gp induction reduces cyclosporine by 80% — transplant rejection.", recommendation: "Avoid combination. If unavoidable, monitor levels and increase dose massively." },
    { drug: "atorvastatin", severity: "critical", description: "Cyclosporine inhibits statin metabolism — rhabdomyolysis.", recommendation: "Contraindicated. Use pravastatin at lowest dose." },
    { drug: "nsaids", severity: "high", description: "Additive nephrotoxicity — acute kidney injury risk.", recommendation: "Avoid NSAIDs. Use paracetamol for analgesia." },
    { drug: "ibuprofen", severity: "high", description: "Additive nephrotoxicity in transplant patients.", recommendation: "Avoid. Use paracetamol." },
  ],
  tacrolimus: [
    { drug: "clarithromycin", severity: "critical", description: "CYP3A4/P-gp inhibition increases tacrolimus levels dramatically — nephrotoxicity, neurotoxicity.", recommendation: "Monitor tacrolimus levels daily. Significant dose reduction required." },
    { drug: "rifampicin", severity: "critical", description: "CYP3A4 induction reduces tacrolimus by >80% — transplant rejection.", recommendation: "Avoid. If unavoidable, increase dose 3-5× and monitor daily levels." },
    { drug: "fluconazole", severity: "high", description: "CYP3A4 inhibition increases tacrolimus — toxicity.", recommendation: "Monitor tacrolimus levels closely. Reduce dose." },
    { drug: "ibuprofen", severity: "moderate", description: "Additive nephrotoxicity in transplant recipients.", recommendation: "Avoid NSAIDs. Use paracetamol." },
  ],

  // ── Diabetes ─────────────────────────────────────────────────────────────────
  glibenclamide: [
    { drug: "fluconazole", severity: "high", description: "CYP2C9 inhibition increases glibenclamide levels — severe prolonged hypoglycemia.", recommendation: "Monitor blood glucose closely. Reduce glibenclamide dose." },
    { drug: "ciprofloxacin", severity: "moderate", description: "Fluoroquinolones can cause both hypoglycemia and hyperglycemia in patients on sulfonylureas.", recommendation: "Monitor blood glucose carefully during antibiotic course." },
    { drug: "alcohol", severity: "moderate", description: "Alcohol potentiates hypoglycemic effect and masks symptoms.", recommendation: "Advise patient to avoid alcohol. Educate about altered hypoglycemia symptoms." },
  ],
  insulin: [
    { drug: "alcohol", severity: "high", description: "Alcohol inhibits gluconeogenesis — severe prolonged hypoglycemia, especially overnight.", recommendation: "Educate patient. Reduce insulin if alcohol consumed. Snack before bed." },
    { drug: "beta blockers", severity: "moderate", description: "Beta-blockers mask tachycardia and sweating of hypoglycemia — delayed recognition.", recommendation: "Educate on remaining symptoms (pallor, confusion). Use cardioselective beta-blocker if needed." },
    { drug: "corticosteroids", severity: "high", description: "Corticosteroids cause hyperglycemia — insulin requirements increase significantly.", recommendation: "Increase insulin monitoring. May need 20-50% dose increase. Taper steroids carefully." },
  ],

  // ── Analgesics ───────────────────────────────────────────────────────────────
  paracetamol: [
    { drug: "warfarin", severity: "moderate", description: "Regular high-dose paracetamol (> 2g/day) can potentiate warfarin — INR elevation.", recommendation: "Limit paracetamol to ≤ 2g/day in anticoagulated patients. Monitor INR." },
    { drug: "alcohol", severity: "high", description: "Chronic alcohol use combined with paracetamol causes hepatotoxicity at standard doses.", recommendation: "Avoid combination in heavy drinkers. Limit to 1-2g/day maximum." },
    { drug: "rifampicin", severity: "moderate", description: "CYP450 induction increases hepatotoxic paracetamol metabolite formation.", recommendation: "Reduce paracetamol dose. Monitor liver function." },
  ],
  colchicine: [
    { drug: "clarithromycin", severity: "critical", description: "P-gp/CYP3A4 inhibition dramatically increases colchicine — life-threatening toxicity (marrow suppression, multi-organ failure).", recommendation: "Contraindicated in renal impairment. Reduce colchicine to single 0.6mg dose in normal renal function." },
    { drug: "cyclosporine", severity: "critical", description: "P-gp inhibition increases colchicine — severe toxicity.", recommendation: "Contraindicated combination. Avoid." },
    { drug: "verapamil", severity: "high", description: "P-gp inhibition increases colchicine levels — neuromuscular toxicity.", recommendation: "Reduce colchicine dose significantly. Monitor closely." },
  ],

  // ── Respiratory ──────────────────────────────────────────────────────────────
  theophylline: [
    { drug: "ciprofloxacin", severity: "high", description: "CYP1A2 inhibition raises theophylline to toxic levels — seizures, arrhythmias.", recommendation: "Reduce theophylline dose by 50%. Monitor levels. Use alternative antibiotic." },
    { drug: "clarithromycin", severity: "high", description: "CYP3A4 inhibition increases theophylline — toxicity risk.", recommendation: "Monitor theophylline levels closely during antibiotic course." },
    { drug: "rifampicin", severity: "high", description: "CYP1A2 induction reduces theophylline levels — loss of bronchodilation.", recommendation: "Monitor theophylline levels. May need dose increase." },
    { drug: "fluoxetine", severity: "moderate", description: "CYP1A2 inhibition may increase theophylline levels.", recommendation: "Monitor theophylline levels when starting or changing fluoxetine dose." },
  ],

  // ── Antifungals ──────────────────────────────────────────────────────────────
  fluconazole: [
    { drug: "warfarin", severity: "critical", description: "CYP2C9 inhibition dramatically increases warfarin levels — severe bleeding risk.", recommendation: "Monitor INR daily when fluconazole added. Warfarin dose reduction often 25-50%." },
    { drug: "phenytoin", severity: "high", description: "CYP2C9 inhibition increases phenytoin — toxicity risk.", recommendation: "Monitor phenytoin levels. Dose reduction likely needed." },
    { drug: "glibenclamide", severity: "high", description: "CYP2C9 inhibition increases sulfonylurea levels — severe hypoglycemia.", recommendation: "Monitor blood glucose closely. Reduce sulfonylurea dose." },
    { drug: "tacrolimus", severity: "high", description: "CYP3A4 inhibition increases tacrolimus — nephrotoxicity.", recommendation: "Monitor tacrolimus levels. Reduce dose." },
    { drug: "carbamazepine", severity: "moderate", description: "May increase carbamazepine levels via CYP3A4 inhibition.", recommendation: "Monitor carbamazepine levels." },
  ],
  itraconazole: [
    { drug: "simvastatin", severity: "critical", description: "Potent CYP3A4 inhibitor — markedly increases simvastatin. Rhabdomyolysis risk.", recommendation: "Contraindicated. Hold simvastatin during treatment." },
    { drug: "atorvastatin", severity: "critical", description: "Potent CYP3A4 inhibitor increases atorvastatin dramatically — rhabdomyolysis.", recommendation: "Contraindicated. Switch to pravastatin or rosuvastatin." },
    { drug: "rivaroxaban", severity: "critical", description: "CYP3A4/P-gp inhibition — markedly increases rivaroxaban. Fatal bleeding risk.", recommendation: "Contraindicated combination. Use alternative antifungal." },
    { drug: "digoxin", severity: "moderate", description: "P-gp inhibition increases digoxin levels.", recommendation: "Monitor digoxin levels and ECG." },
  ],
};

const ARABIC_CONDITIONS_MAP: Record<string, string> = {
  "السكري من النوع الثاني": "type 2 diabetes",
  "السكري من النوع الأول": "type 1 diabetes",
  "السكري": "diabetes",
  "ارتفاع ضغط الدم": "hypertension",
  "أمراض القلب التاجية": "coronary artery disease",
  "فشل القلب": "heart failure",
  "قصور القلب": "heart failure",
  "الفشل الكلوي المزمن": "chronic kidney disease",
  "مرض الكلى المزمن": "chronic kidney disease",
  "مرض الانسداد الرئوي المزمن": "copd",
  "الربو": "asthma",
  "قصور الغدة الدرقية": "hypothyroidism",
  "فرط نشاط الغدة الدرقية": "hyperthyroidism",
  "السرطان": "cancer",
  "الرجفان الأذيني": "atrial fibrillation",
  "السكتة الدماغية": "stroke",
  "تشمع الكبد": "cirrhosis",
  "الاكتئاب": "depression",
};

function normalizeCondition(name: string): string {
  return ARABIC_CONDITIONS_MAP[name.trim()] ?? ARABIC_CONDITIONS_MAP[name.toLowerCase().trim()] ?? name.toLowerCase().trim();
}

function normalizeDrug(drug: string): string {
  return drug.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

export function checkDrugInteractions(
  newDrug: string,
  existingMedications: string[],
  allergies: string[] = []
): InteractionWarning[] {
  const normalizedNew = normalizeDrug(newDrug);
  const warnings: InteractionWarning[] = [];

  // 1. Check for Allergy Contraindications
  const drug = newDrug.toLowerCase();
  for (const allergy of allergies) {
    const allergyL = allergy.toLowerCase();
    if (
      (allergyL.includes("penicillin") && (drug.includes("amoxicillin") || drug.includes("ampicillin") || drug.includes("penicillin") || drug.includes("augmentin"))) ||
      (allergyL.includes("sulfa") && (drug.includes("sulfamethoxazole") || drug.includes("bactrim"))) ||
      ((allergyL.includes("aspirin") || allergyL.includes("nsaid")) && (drug.includes("ibuprofen") || drug.includes("naproxen") || drug.includes("aspirin") || drug.includes("diclofenac"))) ||
      (allergyL.includes("cephalosporin") && (drug.includes("cephalexin") || drug.includes("ceftriaxone") || drug.includes("cefuroxime")))
    ) {
      warnings.push({
        severity: "critical",
        conflictingDrug: allergy,
        description: `⚠️ ALLERGY CONFLICT: Patient is allergic to ${allergy}.`,
        recommendation: `CONTRAINDICATED. Do not prescribe ${newDrug}. High risk of anaphylaxis or severe hypersensitivity reaction. Consult for alternative therapy.`
      });
    }
  }

  for (const existingDrug of existingMedications) {
    const normalizedExisting = normalizeDrug(existingDrug);

    const interactions = INTERACTION_DATABASE[normalizedNew] || [];
    for (const interaction of interactions) {
      if (normalizeDrug(interaction.drug) === normalizedExisting) {
        warnings.push({
          severity: interaction.severity,
          conflictingDrug: existingDrug,
          description: interaction.description,
          recommendation: interaction.recommendation,
        });
      }
    }

    const reverseInteractions = INTERACTION_DATABASE[normalizedExisting] || [];
    for (const interaction of reverseInteractions) {
      if (normalizeDrug(interaction.drug) === normalizedNew) {
        const alreadyAdded = warnings.some(w => normalizeDrug(w.conflictingDrug) === normalizedExisting);
        if (!alreadyAdded) {
          warnings.push({
            severity: interaction.severity,
            conflictingDrug: existingDrug,
            description: interaction.description,
            recommendation: interaction.recommendation,
          });
        }
      }
    }
  }

  return warnings;
}

export interface RiskFactor {
  factor: string;
  impact: "low" | "moderate" | "high";
  description: string;
}

export interface RiskScoreResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: RiskFactor[];
  recommendations: string[];
}

export function calculateRiskScore(patient: {
  dateOfBirth: string;
  chronicConditions: string[] | null;
  allergies: string[] | null;
  medicationCount: number;
  recentAbnormalLabs: number;
  visitFrequency: number;
}): RiskScoreResult {
  let score = 0;
  const factors: RiskFactor[] = [];
  const recommendations: string[] = [];

  const birthYear = new Date(patient.dateOfBirth).getFullYear();
  const age = new Date().getFullYear() - birthYear;

  if (age >= 75) {
    score += 25;
    factors.push({ factor: "Advanced Age", impact: "high", description: `Patient is ${age} years old. Elderly patients have higher complication risk.` });
    recommendations.push("Geriatric assessment recommended. Review all medications for appropriateness.");
  } else if (age >= 60) {
    score += 15;
    factors.push({ factor: "Senior Age", impact: "moderate", description: `Patient is ${age} years old.` });
    recommendations.push("Regular preventive screenings recommended.");
  } else if (age >= 45) {
    score += 5;
    factors.push({ factor: "Middle Age", impact: "low", description: `Patient is ${age} years old.` });
  }

  const conditions = patient.chronicConditions || [];
  const highRiskConditions = ["heart failure", "coronary artery disease", "chronic kidney disease", "ckd", "cirrhosis", "copd", "cancer", "diabetes mellitus"];
  const moderateRiskConditions = ["hypertension", "diabetes", "hypothyroidism", "hyperthyroidism", "asthma", "atrial fibrillation", "stroke", "depression"];

  for (const cond of conditions) {
    const normalized = normalizeCondition(cond);
    if (highRiskConditions.some(h => normalized.includes(h))) {
      score += 20;
      factors.push({ factor: `Chronic Condition: ${cond}`, impact: "high", description: `${cond} significantly increases medical risk.` });
      recommendations.push(`Regular specialist follow-up for ${cond} management.`);
    } else if (moderateRiskConditions.some(m => normalized.includes(m))) {
      score += 10;
      factors.push({ factor: `Chronic Condition: ${cond}`, impact: "moderate", description: `${cond} requires ongoing management.` });
    }
  }

  if (patient.medicationCount >= 5) {
    score += 20;
    factors.push({ factor: "Polypharmacy", impact: "high", description: `Patient is on ${patient.medicationCount} medications. High risk of drug interactions.` });
    recommendations.push("Medication reconciliation review recommended. Consider deprescribing.");
  } else if (patient.medicationCount >= 3) {
    score += 10;
    factors.push({ factor: "Multiple Medications", impact: "moderate", description: `Patient is on ${patient.medicationCount} medications.` });
    recommendations.push("Review medication list for potential interactions at each visit.");
  }

  if ((patient.allergies?.length ?? 0) >= 3) {
    score += 10;
    factors.push({ factor: "Multiple Allergies", impact: "moderate", description: `Patient has ${patient.allergies?.length} documented allergies.` });
    recommendations.push("Allergy alert prominently displayed. Verify before prescribing any new medication.");
  }

  if (patient.recentAbnormalLabs >= 3) {
    score += 20;
    factors.push({ factor: "Multiple Abnormal Lab Results", impact: "high", description: `${patient.recentAbnormalLabs} recent abnormal lab results indicating active pathology.` });
    recommendations.push("Urgent specialist review of abnormal lab results.");
  } else if (patient.recentAbnormalLabs >= 1) {
    score += 10;
    factors.push({ factor: "Abnormal Lab Results", impact: "moderate", description: `${patient.recentAbnormalLabs} recent abnormal lab results.` });
    recommendations.push("Follow up on abnormal lab results.");
  }

  if (patient.visitFrequency >= 6) {
    score += 15;
    factors.push({ factor: "Frequent Hospitalizations", impact: "high", description: `Patient had ${patient.visitFrequency} hospital visits in the past year.` });
    recommendations.push("Care coordinator assessment recommended to prevent further hospitalizations.");
  }

  score = Math.min(score, 100);

  let riskLevel: "low" | "medium" | "high" | "critical";
  if (score < 20) riskLevel = "low";
  else if (score < 40) riskLevel = "medium";
  else if (score < 70) riskLevel = "high";
  else riskLevel = "critical";

  if (recommendations.length === 0) {
    recommendations.push("Continue routine health monitoring and preventive care.");
  }

  return { riskScore: score, riskLevel, factors, recommendations };
}

export interface PredictionWarning {
  type: "deterioration" | "pattern" | "risk_escalation" | "adherence" | "complication";
  severity: "low" | "moderate" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  confidence: "low" | "moderate" | "high";
}

export interface ClinicalAction {
  action: "DO_NOT_GIVE" | "MONITOR" | "URGENT_REVIEW" | "ALERT_FAMILY" | "PREPARE_EQUIPMENT" | "HOLD_MEDICATION";
  priority: "immediate" | "urgent" | "standard";
  description: string;
  reason: string;
}

interface LabResultInput {
  testName: string;
  result: string;
  status: "normal" | "abnormal" | "critical";
  testDate: string;
}

interface VisitInput {
  visitDate: string;
  visitType: string;
  diagnosis: string;
}

export function generatePredictions(patient: {
  dateOfBirth: string;
  chronicConditions: string[] | null;
  labResults: LabResultInput[];
  visits: VisitInput[];
  medicationCount: number;
  allergies: string[] | null;
}): PredictionWarning[] {
  const predictions: PredictionWarning[] = [];
  const conditions = (patient.chronicConditions || []).map(c => c.toLowerCase());

  const sortedLabs = [...patient.labResults].sort(
    (a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
  );

  const criticalLabs = sortedLabs.filter(l => l.status === "critical");
  const abnormalLabs = sortedLabs.filter(l => l.status !== "normal");

  const labsByName: Record<string, LabResultInput[]> = {};
  for (const lab of sortedLabs) {
    const key = lab.testName.toLowerCase().trim();
    if (!labsByName[key]) labsByName[key] = [];
    labsByName[key].push(lab);
  }

  for (const [, labGroup] of Object.entries(labsByName)) {
    if (labGroup.length >= 2) {
      const recentGroup = labGroup.slice(0, 3);
      const allAbnormal = recentGroup.every(l => l.status !== "normal");
      if (allAbnormal) {
        predictions.push({
          type: "deterioration",
          severity: labGroup[0]?.status === "critical" ? "critical" : "high",
          title: `Persistently Abnormal: ${labGroup[0]?.testName}`,
          description: `${labGroup[0]?.testName} has been consistently abnormal across ${recentGroup.length} recent tests, indicating an unresolved or worsening condition.`,
          recommendation: "Urgent specialist review recommended. Consider adjusting treatment protocol.",
          confidence: "high",
        });
      }

      const numericValues = recentGroup.map(l => parseFloat(l.result)).filter(v => !isNaN(v));
      if (numericValues.length >= 2) {
        const latest = numericValues[0]!;
        const oldest = numericValues[numericValues.length - 1]!;
        const trend = latest - oldest;
        const pctChange = Math.abs(trend / (oldest || 1)) * 100;

        if (trend > 0 && pctChange > 15 && labGroup[0]?.status !== "normal") {
          predictions.push({
            type: "deterioration",
            severity: pctChange > 30 ? "high" : "moderate",
            title: `Rising Trend: ${labGroup[0]?.testName} ↑`,
            description: `${labGroup[0]?.testName} has increased by ${Math.round(pctChange)}% over recent measurements (latest: ${labGroup[0]?.result}).`,
            recommendation: "Monitor closely. Adjust medication or investigate underlying cause.",
            confidence: "high",
          });
        }
      }
    }
  }

  if (criticalLabs.length > 0) {
    predictions.push({
      type: "risk_escalation",
      severity: "critical",
      title: "Critical Laboratory Values Detected",
      description: `${criticalLabs.length} lab result(s) in the critical range (${criticalLabs.map(l => l.testName).join(", ")}). Immediate intervention may be required.`,
      recommendation: "Immediate physician review. Consider urgent intervention or escalation of care.",
      confidence: "high",
    });
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);
  const threeMonthsAgo = new Date(now); threeMonthsAgo.setMonth(now.getMonth() - 3);

  const recentVisits = patient.visits.filter(v => new Date(v.visitDate) >= sixMonthsAgo);
  const veryRecentVisits = patient.visits.filter(v => new Date(v.visitDate) >= threeMonthsAgo);
  const emergencyVisits = recentVisits.filter(v => v.visitType === "emergency" || v.visitType === "inpatient");

  if (veryRecentVisits.length >= 3) {
    predictions.push({
      type: "pattern",
      severity: "high",
      title: "Escalating Admission Pattern",
      description: `Patient has had ${veryRecentVisits.length} hospital visits in the last 3 months, indicating a possible worsening trajectory.`,
      recommendation: "Care coordinator review. Consider transitional care program to prevent further admissions.",
      confidence: "high",
    });
  } else if (emergencyVisits.length >= 2) {
    predictions.push({
      type: "pattern",
      severity: "moderate",
      title: "Recurrent Emergency Presentations",
      description: `${emergencyVisits.length} emergency visits in the past 6 months may indicate suboptimal disease control.`,
      recommendation: "Review treatment adherence and outpatient follow-up schedule.",
      confidence: "moderate",
    });
  }

  if (conditions.some(c => c.includes("diabetes") || c.includes("type 1") || c.includes("type 2"))) {
    const hba1cKeys = ["hba1c", "glycated hemoglobin", "glycohemoglobin", "hemoglobin a1c"];
    const hba1c = hba1cKeys.flatMap(k => labsByName[k] ?? []);
    const hasHighHba1c = hba1c.some(l => { const val = parseFloat(l.result); return !isNaN(val) && val > 7.5; });
    if (hasHighHba1c || (hba1c.length === 0 && abnormalLabs.length > 0)) {
      predictions.push({
        type: "complication",
        severity: "high",
        title: "Diabetic Complication Risk",
        description: "Poorly controlled diabetes significantly increases risk of nephropathy, retinopathy, neuropathy, and cardiovascular events.",
        recommendation: "Optimize glycemic control. Screen for micro/macrovascular complications. Endocrinology referral if HbA1c > 8%.",
        confidence: "high",
      });
    }
  }

  if (conditions.some(c => c.includes("heart failure"))) {
    if (emergencyVisits.length >= 1 || abnormalLabs.length >= 2) {
      predictions.push({
        type: "complication",
        severity: "high",
        title: "Decompensated Heart Failure Risk",
        description: "Pattern of emergency admissions and abnormal labs suggests risk of cardiac decompensation.",
        recommendation: "Optimize diuretic therapy. Daily weight monitoring. Strict fluid restriction. Cardiology follow-up within 2 weeks.",
        confidence: "moderate",
      });
    }
  }

  if (conditions.some(c => c.includes("ckd") || c.includes("kidney") || c.includes("renal"))) {
    const renalKeys = ["creatinine", "serum creatinine", "egfr", "gfr"];
    const hasWorsening = renalKeys.flatMap(k => labsByName[k] ?? []).some(l => l.status !== "normal");
    if (hasWorsening) {
      predictions.push({
        type: "deterioration",
        severity: "high",
        title: "CKD Progression Risk",
        description: "Worsening renal function markers suggest accelerated kidney disease progression.",
        recommendation: "Nephrology urgent referral. Avoid nephrotoxic medications. Optimize BP control.",
        confidence: "high",
      });
    }
  }

  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
  if (age >= 65 && conditions.length >= 3 && patient.medicationCount >= 5) {
    predictions.push({
      type: "risk_escalation",
      severity: "high",
      title: "Frailty & Polypharmacy Risk",
      description: `Elderly patient (${age}y) with ${conditions.length} chronic conditions and ${patient.medicationCount} medications — significant frailty and fall risk.`,
      recommendation: "Comprehensive geriatric assessment. Medication deprescribing review. Fall prevention program.",
      confidence: "high",
    });
  }

  if (patient.medicationCount >= 5 && patient.visits.length > 0) {
    const timeSinceLastVisit =
      (now.getTime() - new Date(patient.visits[0]?.visitDate ?? now).getTime()) / (1000 * 60 * 60 * 24);
    if (timeSinceLastVisit > 180) {
      predictions.push({
        type: "adherence",
        severity: "moderate",
        title: "Potential Medication Non-Adherence",
        description: `Patient on ${patient.medicationCount} medications with no visit recorded in over 6 months.`,
        recommendation: "Phone-based adherence check. Consider pharmacy follow-up or community health worker visit.",
        confidence: "moderate",
      });
    }
  }

  const seen = new Set<string>();
  return predictions.filter(p => {
    if (seen.has(p.title)) return false;
    seen.add(p.title);
    return true;
  }).slice(0, 8);
}

export function generateClinicalActions(
  allergies: string[] | null,
  currentMeds: string[],
  riskLevel: string,
  chronicConditions: string[] | null
): ClinicalAction[] {
  const actions: ClinicalAction[] = [];
  const allergyLower = (allergies || []).map(a => a.toLowerCase());
  const medsLower = currentMeds.map(m => m.toLowerCase());
  const condLower = (chronicConditions || []).map(c => c.toLowerCase());

  for (const allergy of allergyLower) {
    if (allergy.includes("penicillin") || allergy.includes("amoxicillin") || allergy.includes("ampicillin")) {
      actions.push({ action: "DO_NOT_GIVE", priority: "immediate", description: "DO NOT administer Penicillin, Amoxicillin, or Ampicillin", reason: "Documented penicillin allergy — use macrolides or cephalosporins with caution" });
    }
    if (allergy.includes("sulfa") || allergy.includes("sulfonamide") || allergy.includes("sulfamethoxazole")) {
      actions.push({ action: "DO_NOT_GIVE", priority: "immediate", description: "DO NOT administer Sulfonamides or TMP-SMX", reason: "Documented sulfa allergy — risk of anaphylaxis" });
    }
    if (allergy.includes("nsaid") || allergy.includes("aspirin") || allergy.includes("ibuprofen")) {
      actions.push({ action: "DO_NOT_GIVE", priority: "immediate", description: "DO NOT administer NSAIDs or Aspirin", reason: "Documented NSAID allergy — use paracetamol for pain management" });
    }
    if (allergy.includes("contrast") || allergy.includes("iodine")) {
      actions.push({ action: "DO_NOT_GIVE", priority: "immediate", description: "ALERT before any imaging with contrast dye", reason: "Documented contrast/iodine allergy — pre-medicate if contrast necessary" });
    }
    if (allergy.includes("latex")) {
      actions.push({ action: "PREPARE_EQUIPMENT", priority: "urgent", description: "Use LATEX-FREE equipment and gloves throughout", reason: "Documented latex allergy — risk of anaphylaxis" });
    }
    if (allergy.includes("morphine") || allergy.includes("codeine") || allergy.includes("opioid")) {
      actions.push({ action: "DO_NOT_GIVE", priority: "immediate", description: "DO NOT administer Morphine, Codeine, or Opioids", reason: "Documented opioid allergy — use alternative analgesic" });
    }
    if (allergy.includes("cephalosporin")) {
      actions.push({ action: "DO_NOT_GIVE", priority: "immediate", description: "DO NOT administer Cephalosporins", reason: "Documented cephalosporin allergy" });
    }
  }

  const hasWarfarin = medsLower.some(m => m.includes("warfarin") || m.includes("coumadin"));
  const hasAmiodarone = medsLower.some(m => m.includes("amiodarone"));
  const hasInsulin = medsLower.some(m => m.includes("insulin"));
  const hasDigoxin = medsLower.some(m => m.includes("digoxin"));
  const hasBetaBlocker = medsLower.some(m => ["metoprolol", "atenolol", "bisoprolol", "carvedilol", "propranolol"].some(bb => m.includes(bb)));
  const hasMetformin = medsLower.some(m => m.includes("metformin"));

  if (hasWarfarin) {
    actions.push({ action: "MONITOR", priority: "urgent", description: "Check INR before any invasive procedure or new prescription", reason: "Patient on Warfarin — significant bleeding risk" });
    if (hasAmiodarone) {
      actions.push({ action: "URGENT_REVIEW", priority: "immediate", description: "CRITICAL: Warfarin + Amiodarone interaction — check INR immediately", reason: "Amiodarone potentiates warfarin by 30-50% — life-threatening bleeding risk" });
    }
  }

  if (hasInsulin) {
    actions.push({ action: "MONITOR", priority: "urgent", description: "Check blood glucose before any procedure or new medications", reason: "Patient on Insulin — hypoglycemia risk especially under fasting/stress" });
  }

  if (hasDigoxin) {
    actions.push({ action: "MONITOR", priority: "urgent", description: "Check electrolytes (K⁺, Mg²⁺) before treatment", reason: "Patient on Digoxin — electrolyte imbalance increases toxicity risk" });
  }

  if (hasBetaBlocker) {
    actions.push({ action: "HOLD_MEDICATION", priority: "urgent", description: "Do NOT give IV Verapamil or IV Diltiazem", reason: "Fatal bradycardia and complete heart block risk with concurrent beta-blocker" });
  }

  if (hasMetformin) {
    actions.push({ action: "HOLD_MEDICATION", priority: "urgent", description: "HOLD Metformin 48h before any contrast imaging procedure", reason: "Contrast-induced nephropathy + metformin = lactic acidosis risk" });
  }

  if (riskLevel === "critical") {
    actions.push({ action: "ALERT_FAMILY", priority: "urgent", description: "Notify emergency contact immediately", reason: "Patient is classified CRITICAL RISK" });
    actions.push({ action: "URGENT_REVIEW", priority: "immediate", description: "Senior physician review required before any treatment decision", reason: "Critical risk score — complex multi-morbidity requires senior oversight" });
  }

  if (condLower.some(c => c.includes("kidney") || c.includes("ckd") || c.includes("renal"))) {
    actions.push({ action: "MONITOR", priority: "urgent", description: "Adjust all renally-cleared medications for current GFR", reason: "Chronic kidney disease — standard doses may accumulate and cause toxicity" });
  }

  if (condLower.some(c => c.includes("liver") || c.includes("cirrhosis") || c.includes("hepatic"))) {
    actions.push({ action: "MONITOR", priority: "urgent", description: "Avoid hepatotoxic or hepatically-metabolized medications at standard doses", reason: "Liver disease — impaired drug metabolism increases toxicity risk" });
  }

  const seen = new Set<string>();
  return actions.filter(a => {
    if (seen.has(a.description)) return false;
    seen.add(a.description);
    return true;
  }).slice(0, 8);
}
