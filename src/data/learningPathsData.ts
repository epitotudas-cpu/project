export interface LearningPathItem {
  id: string;
  tradeName: string;
  badgeColor: string;
  level: string;
  title: string;
  description: string;
  nextCareerStep: string;
  courseIds: string[];
}

export const LEARNING_PATHS_DATA: LearningPathItem[] = [
  {
    id: 'path-mason',
    tradeName: 'Kőműves',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    level: 'Kezdő → Mester',
    title: 'Kezdő kőművesből szerkezetépítő mester',
    description: 'Komplex szerkezetépítés és falazási technológiák mesterszintű elsajátítása az alapismeretektől a mestervizsgáig.',
    nextCareerStep: 'Mestervizsga & Építésvezető',
    courseIds: ['gipszkartonozas-es-szarazepitesi-alapismeretek'],
  },
  {
    id: 'path-safety',
    tradeName: 'Munkavédelem',
    badgeColor: 'bg-red-100 text-red-900 border-red-300',
    level: 'Kezdő',
    title: 'Munkavédelmi és biztonsági alapismeretek',
    description: 'Alapvető állványozási, egyéni védőeszköz és munkabiztonsági előírások az építési munkaterületeken.',
    nextCareerStep: 'Munkavédelmi megbízott',
    courseIds: ['epitoipari-munkavedelmi-alapismeretek'],
  },
  {
    id: 'path-eco',
    tradeName: 'Gépészet & Hőszigetelés',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    level: 'Haladó',
    title: 'Energiahatékony és fenntartható építés',
    description: 'Korszerű hőszigetelések, hőhídmentes csomópontok és zöld építési megoldások a fenntartható kivitelezésért.',
    nextCareerStep: 'Energetikai tanácsadó / Szakértő',
    courseIds: ['energiahatekony-es-fenntarthato-epites'],
  },
  {
    id: 'path-structure',
    tradeName: 'Szerkezetépítés',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    level: 'Haladó → Mester',
    title: 'Szerkezetépítési alapok & zsaluzási technológia',
    description: 'Zsaluzási rendszerek, vasalás és monolit betonozási technológiák a modern szerkezetépítésben.',
    nextCareerStep: 'Zsaluzó csoportvezető',
    courseIds: ['szerkezetepitesi-alapok-es-zsaluzas'],
  },
];
