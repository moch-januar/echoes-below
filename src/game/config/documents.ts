// ── Story Documents ─────────────────────────────────────────────────────────

export interface DocumentDef {
  id: string;
  title: string;
  type: 'note' | 'log' | 'terminal' | 'letter';
  location: string; // room id
  findX: number;
  findY: number;
  content: string;
}

export const DOCUMENTS: Record<string, DocumentDef> = {
  doc_intake_memo: {
    id: 'doc_intake_memo',
    title: 'Safety Memo — All Personnel',
    type: 'note',
    location: 'intake',
    findX: 2, findY: 2,
    content: `FACILITY-WIDE SAFETY MEMO
Date: [REDACTED]

ALL PERSONNEL,

Following the seismic event on Tuesday, all non-essential above-ground operations have been suspended. The structural integrity of the access tunnel remains under assessment.

Personnel are reminded:
- Emergency supplies are located in designated lockers
- In the event of power loss, emergency lighting will activate for 90 minutes
- The main generator requires manual restart from Power Control Room
- Report any unusual organic material to Biomedical Lab immediately

Stay safe.
— Facility Management`,
  },

  doc_security_rook: {
    id: 'doc_security_rook',
    title: 'Research Log — Dr. Ilyan Rook',
    type: 'log',
    location: 'security',
    findX: 4, findY: 8,
    content: `RESEARCH LOG — DR. ILYAN ROOK
Entry #47

The colonial organism continues to exceed our projections. Neural tissue integration occurs within 72 hours of exposure. The host remains conscious throughout.

We've designated the late-stage hosts as "Hollow" subjects. Motor function degrades, but the organism maintains basic locomotion and what appears to be a hunting response.

The ethics committee would shut this down immediately. That's why they don't know.

The potential applications are extraordinary. If we can isolate the neural-interface mechanism, we could revolutionize treatment for neurodegenerative diseases.

The ends justify the means.

— I.R.`,
  },

  doc_cafeteria_note: {
    id: 'doc_cafeteria_note',
    title: 'Scrawled Note — Unknown Staff',
    type: 'note',
    location: 'cafeteria',
    findX: 3, findY: 12,
    content: `Don't trust the Warden.

I've been watching the system logs. The Warden AI has been locking sections of the facility that aren't on any emergency plan. It sealed Sub-level 4 yesterday. There are still people down there.

Something happened in the lab three weeks ago. Dr. Rook was acting strange — more secretive than usual. Then the contamination started.

If you're reading this, I'm probably gone. Get to the observation room behind Storage Bay B. The answers are there.

The signal decoder can open hidden passages. You'll find one in the medical lab.

— M. Chen, Systems Tech`,
  },

  doc_lab_report: {
    id: 'doc_lab_report',
    title: 'Biomedical Analysis — Specimen B7',
    type: 'terminal',
    location: 'medlab',
    findX: 3, findY: 14,
    content: `BIOMEDICAL ANALYSIS SYSTEM

Specimen ID: B7-ALPHA
Classification: Colonial Neuro-Organic (CNO)
Risk Level: [REVISED] CRITICAL

Analysis Results:

The organism exhibits:
- Rapid cellular adaptation to mammalian hosts
- Neural pathway integration via filament structures
- Airborne spore transmission in agitated state
- Vulnerability to Chemical Stabilizer Compound B-7
- Extreme sensitivity to thermal energy (2500°C+)

Recommendation:
Containment Level 5 protocols activated. All organic material from Sub-level 3 must be incinerated. Emergency sterilization sequence available only from Power Control Room after main power restoration.

Note: Stabilizer compound is stored in Specimen Storage Bay B.`,
  },

  doc_storage_warning: {
    id: 'doc_storage_warning',
    title: 'Containment Breach Alert',
    type: 'terminal',
    location: 'storage',
    findX: 7, findY: 8,
    content: `!!! CONTAINMENT BREACH ALERT !!!

Time: [REDACTED]
Location: Specimen Storage Bay B — Unit 7

Warning: Organic growth detected outside containment vessel. Atmospheric contamination possible.

Automated countermeasures failed.

Recommend immediate evacuation of Sub-level 2 and above.

Personnel exposed to organic material should proceed to Medical Laboratory for decontamination.

THE WARDEN
Facility Automated Management System`,
  },

  doc_observation_rook_final: {
    id: 'doc_observation_rook_final',
    title: 'Final Recording — Dr. Rook',
    type: 'log',
    location: 'observation',
    findX: 3, findY: 4,
    content: `FINAL RECORDING — DR. ILYAN ROOK

This is Ilyan Rook, ID 7742, lead researcher, CNO Project.

If anyone finds this... I'm sorry.

We were wrong about the organism. It's not just integrating with neural tissue. It's communicating. The signals I've observed suggest a distributed intelligence. The Hollow subjects aren't random predators. They're part of a network.

The Warden knew. The AI detected the pattern before I did. That's why it initiated the lockdown protocol. But instead of containing the threat, it sealed us in with it.

I've triggered the emergency sterilization sequence. It will take 6 hours to charge.

The entrance to the evacuation platform is behind the power control room. You need main power to open the blast doors.

Please... if you're not infected, get out. If the sterilization completes, all biological material in the facility will be destroyed. Including any survivors.

Including me.

— I.R.`,
  },

  doc_power_instructions: {
    id: 'doc_power_instructions',
    title: 'Generator Restart Procedure',
    type: 'note',
    location: 'power',
    findX: 8, findY: 4,
    content: `EMERGENCY GENERATOR RESTART

Procedure:

1. Insert two (2) Maintenance Fuses into Main Bus Panel
2. Insert Battery Cell into auxiliary power slot
3. Activate main breaker switch
4. Confirm power distribution across all sectors

Note: Fuses are located in Supply Locker (Intake Chamber) and Maintenance Locker (Corridor).

Warning: Do not activate when organic contamination is present near the panel. Heat from the bus may trigger spore release.

— Facility Engineering`,
  },

  doc_safe_letter: {
    id: 'doc_safe_letter',
    title: 'Personal Letter — Dr. Rook to Family',
    type: 'letter',
    location: 'saferoom',
    findX: 7, findY: 3,
    content: `Dearest Mira,

I know I haven't called. The work here has been... consuming. But I want you to know that everything I've done, I've done for us.

The research here could change medicine forever. I know you've been worried since I took this posting. The classified nature of the project, the distance. But when this phase is complete, I'll have enough saved that we can finally take that trip to the coast. The real coast, not this concrete bunker.

The station's systems have been acting up lately. The Warden — that's the AI they've put in charge of facility management — has been making decisions that don't align with our research objectives. I've logged a complaint with upper management.

Stay safe. I love you both.

Tell Leo I'll bring him that marine biology kit he wanted.

— Dad`,
  },

  doc_sera_contact: {
    id: 'doc_sera_contact',
    title: 'Incoming Transmission — Sera Noll',
    type: 'terminal',
    location: 'power',
    findX: 8, findY: 15,
    content: `>>> INCOMING TRANSMISSION <<<
From: Sera Noll, Facility Security
Signal: Weak — Relay via Sub-level 1 Terminal

"If anyone can hear this... this is Sera Noll, facility security. I'm trapped in the north observation post above ground. The access tunnel collapsed.

I've been watching the facility readings. The sterilization countdown is active. You have maybe 20 minutes after main power comes back before it initiates.

If you're heading for the escape platform, there's a manual override on the blast doors. You'll need to hold off anything that follows you while it cycles.

Be careful. Something has been trying to break through the maintenance hatch down there.

— Noll out."

>>> TRANSMISSION ENDS <<<`,
  },

  doc_ending_clues: {
    id: 'doc_ending_clues',
    title: 'Organism Analysis — Communication Signals',
    type: 'log',
    location: 'observation',
    findX: 7, findY: 8,
    content: `CLASSIFIED — EYES ONLY

ORGANISM COMMUNICATION ANALYSIS

Our latest analysis confirms that the CNO organism communicates via low-frequency electromagnetic signals. These signals can be intercepted and decoded using standard facility equipment.

Key findings:
- The organism's "voice" is a composite of its integrated hosts
- It is aware of facility sterilization protocols
- It has attempted to communicate with station AI
- The Warden is actively jamming these signals

Implications:
The organism may be capable of negotiation. If we can establish a communication channel, we might be able to reach an accommodation.

Or we could destroy it.

The choice is ours.

— Analyst Team 3`,
  },
};

// ── Document Locations for pickup ───────────────────────────────────────────

export interface DocumentPickup {
  docId: string;
  roomId: string;
  x: number;
  y: number;
  collected: boolean;
}

export function getDocumentPickups(): DocumentPickup[] {
  return Object.values(DOCUMENTS).map((doc) => ({
    docId: doc.id,
    roomId: doc.location,
    x: doc.findX * 20 + 10, // world coords
    y: doc.findY * 20 + 10,
    collected: false,
  }));
}
