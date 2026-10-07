import spanishExercises from './exercises.es.json' with { type: 'json' };

const definitions = [
  ['Barbell_Bench_Press_-_Medium_Grip','Press de banca','Pecho','Barra', 'Acostate en el banco con los pies apoyados. Bajá la barra de forma controlada hacia el pecho y empujá hasta extender los brazos.'],
  ['Incline_Dumbbell_Press','Press inclinado con mancuernas','Pecho','Mancuernas','Apoyá la espalda en un banco inclinado. Bajá las mancuernas a los lados del pecho y elevá sin golpear las pesas.'],
  ['Dumbbell_Flyes','Aperturas con mancuernas','Pecho','Mancuernas','Acostate en un banco. Con una ligera flexión de codos, abrí los brazos y volvé al centro de forma controlada.'],
  ['Pushups','Flexiones','Pecho','Peso corporal','Alineá el cuerpo desde la cabeza hasta los talones. Flexioná los codos, acercá el pecho al suelo y empujá para volver.'],
  ['Wide-Grip_Lat_Pulldown','Jalón al pecho','Espalda','Máquina','Sentate con las piernas sujetas. Llevá la barra hacia la parte superior del pecho y volvé lentamente, sin balancearte.'],
  ['Bent_Over_Barbell_Row','Remo con barra','Espalda','Barra','Flexioná ligeramente las rodillas e incliná el torso con la espalda neutra. Llevá la barra hacia el abdomen y bajá con control.'],
  ['One-Arm_Dumbbell_Row','Remo con mancuerna','Espalda','Mancuernas','Apoyá una rodilla y una mano en el banco. Tirás de la mancuerna hacia la cadera sin girar el torso.'],
  ['Pullups','Dominadas','Espalda','Peso corporal','Colgate de una barra. Activá la espalda, elevá el cuerpo hasta pasar el mentón y descendé de forma controlada.'],
  ['Barbell_Full_Squat','Sentadilla con barra','Piernas','Barra','Apoyá la barra sobre la parte superior de la espalda. Flexioná caderas y rodillas con los pies firmes y subí de forma controlada.'],
  ['Leg_Press','Prensa de piernas','Piernas','Máquina','Apoyá toda la espalda y colocá los pies en la plataforma. Flexioná las piernas y empujá sin bloquear las rodillas.'],
  ['Romanian_Deadlift','Peso muerto rumano','Piernas','Barra','Con las rodillas levemente flexionadas, llevá la cadera atrás y bajá la barra cerca de las piernas. Extendé la cadera para volver.'],
  ['Dumbbell_Lunges','Zancadas con mancuernas','Piernas','Mancuernas','Da un paso amplio y bajá ambas rodillas. Empujá con la pierna delantera para volver, manteniendo el torso estable.'],
  ['Leg_Extensions','Extensión de cuádriceps','Piernas','Máquina','Ajustá el asiento y apoyá el rodillo sobre los tobillos. Extendé las rodillas y bajá lentamente.'],
  ['Lying_Leg_Curls','Curl femoral','Piernas','Máquina','Acostate boca abajo y ajustá el rodillo sobre los tobillos. Flexioná las rodillas sin despegar las caderas.'],
  ['Standing_Calf_Raises','Elevación de gemelos','Piernas','Máquina','Elevá los talones, sostené un instante y descendé lentamente hasta sentir el estiramiento.'],
  ['Dumbbell_Shoulder_Press','Press de hombros','Hombros','Mancuernas','Sentate con la espalda apoyada. Elevá las mancuernas desde la altura de los hombros sin arquear la zona lumbar.'],
  ['Side_Lateral_Raise','Elevaciones laterales','Hombros','Mancuernas','Con los codos levemente flexionados, elevá los brazos hacia los costados hasta la altura de los hombros.'],
  ['Face_Pull','Jalón a la cara','Hombros','Polea','Tirá de la cuerda hacia la cara, separando las manos y manteniendo el torso estable.'],
  ['Barbell_Curl','Curl de bíceps','Brazos','Barra','Sostené la barra con las palmas hacia arriba. Flexioná los codos sin balancear el torso y bajá con control.'],
  ['Hammer_Curls','Curl martillo','Brazos','Mancuernas','Sostené las mancuernas con las palmas enfrentadas. Flexioná los codos manteniéndolos cerca del cuerpo.'],
  ['Triceps_Pushdown','Extensión de tríceps','Brazos','Polea','Mantené los codos junto al torso. Extendé los brazos hacia abajo sin mover los hombros y volvé lentamente.'],
  ['Plank','Plancha','Core','Peso corporal','Apoyá los antebrazos y las puntas de los pies. Mantené el cuerpo alineado y el abdomen activo mientras respirás.'],
  ['Crunches','Abdominales','Core','Peso corporal','Acostate con las rodillas flexionadas. Elevá ligeramente los hombros contrayendo el abdomen sin tirar del cuello.'],
  ['Hanging_Leg_Raise','Elevación de piernas','Core','Peso corporal','Colgate de la barra. Elevá las piernas de forma controlada, evitando balancearte.']
];
export const catalog = definitions.map(([id,name,muscle,equipment,instruction],i)=>({id,name,muscle,equipment,instructions:[instruction],level:i%3===0?'Intermedio':'Inicial',images:[`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${id}/0.jpg`],source:'Catálogo de respaldo'}));
export const muscles = {abdominals:'Core',abductors:'Piernas',adductors:'Piernas',biceps:'Brazos',calves:'Piernas',chest:'Pecho',forearms:'Brazos',glutes:'Piernas',hamstrings:'Piernas',lats:'Espalda','lower back':'Espalda','middle back':'Espalda',neck:'Hombros',quadriceps:'Piernas',shoulders:'Hombros',traps:'Espalda',triceps:'Brazos'};
export const equipmentNames = {barbell:'Barra',dumbbell:'Mancuernas',cable:'Polea',machine:'Máquina','body only':'Peso corporal',kettlebells:'Kettlebell',bands:'Bandas','exercise ball':'Pelota','e-z curl bar':'Barra EZ','medicine ball':'Pelota medicinal',other:'Otro'};

const curated = new Map(catalog.map(exercise => [exercise.id, exercise]));
export const exerciseText = id => curated.get(id) || (Object.hasOwn(spanishExercises, id) ? spanishExercises[id] : null);
export const exerciseName = (id, fallback) => exerciseText(id)?.name || fallback;

export function localizeExercise(exercise) {
  const text = exerciseText(exercise.id);
  // New upstream entries are included once their Spanish translation is available.
  if (!text) return null;
  return {
    id: exercise.id, name: text.name, instructions: text.instructions,
    muscle: muscles[exercise.primaryMuscles?.[0]] || 'General',
    equipment: equipmentNames[exercise.equipment] || 'Otro',
    level: ({beginner:'Inicial',intermediate:'Intermedio',expert:'Avanzado'})[exercise.level] || 'Intermedio',
    images: (exercise.images || []).map(image => `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${image}`),
    source: 'Free Exercise DB', originalName: exercise.name
  };
}
