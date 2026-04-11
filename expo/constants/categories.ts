export interface CategoryData {
  id: string;
  name: string;
  subcategories: string[];
}

export const CATEGORIES: CategoryData[] = [
  {
    id: 'cereales-grains',
    name: 'Céréales & Grains',
    subcategories: [
      'Riz',
      'Mil',
      'Maïs',
      'Sorgho',
      'Fonio',
      'Blé',
      'Arachide',
      'Niébé',
      'Coton',
      'Sésame',
      'Haricots',
      'Lentilles',
      'Pois chiches',
      'Voandzou (pois bambara)',
    ],
  },
  {
    id: 'fruits-legumes',
    name: 'Fruits & Légumes',
    subcategories: [
      'Tomates',
      'Oignons',
      'Choux',
      'Piments',
      'Carottes',
      'Aubergines',
      'Gombos',
      'Pommes de terre',
      'Mangues',
      'Agrumes',
      'Anacarde',
      'Papayes',
      'Bananes',
      'Oranges',
      'Citrons',
      'Pastèques',
      'Bissap',
      'Pommes',
      'Concombres',
      'Laitue',
      'Haricots verts',
      'Courgettes',
      'Navets',
      'Betteraves',
      'Patates douces',
      'Manioc',
      'Ignames',
      'Jaxatu (aubergine amère)',
      'Diakhatou',
      'Oseille de Guinée',
      'Tamarin',
      'Ditakh',
      'Madd',
      'Corossol',
      'Goyaves',
      'Noix de coco',
    ],
  },
  {
    id: 'betail-bovin',
    name: 'Bétail Bovin',
    subcategories: [
      'Vaches',
      'Zébus',
      'Taureaux',
      'Veaux',
      'Génisses',
      'Bœufs',
    ],
  },
  {
    id: 'petit-betail',
    name: 'Petit Bétail',
    subcategories: [
      'Moutons',
      'Chèvres',
      'Béliers',
      'Agneaux',
      'Brebis',
      'Chevreaux',
    ],
  },
  {
    id: 'volaille',
    name: 'Volaille',
    subcategories: [
      'Poulets',
      'Poules pondeuses',
      'Poulets de chair',
      'Canards',
      'Pintades',
      'Dindes',
      'Œufs',
    ],
  },
  {
    id: 'produits-laitiers',
    name: 'Produits Laitiers',
    subcategories: [
      'Lait frais',
      'Fromage',
      'Yaourt',
      'Beurre',
      'Lait caillé',
    ],
  },
  {
    id: 'produits-ruche',
    name: 'Produits de la Ruche',
    subcategories: [
      'Miel',
      'Propolis',
      'Cire d\'abeille',
      'Pollen',
    ],
  },
  {
    id: 'produits-transformes',
    name: 'Produits Transformés',
    subcategories: [
      'Farine',
      'Huile d\'arachide',
      'Beurre de karité',
      'Jus naturels',
      'Confitures',
      'Viande séchée',
      'Poisson fumé',
      'Riz décortiqué',
      'Thiakry',
      'Couscous de mil',
      'Pâte d\'arachide',
      'Soumbala',
      'Nététou',
      'Sirop de bissap',
      'Sirop de gingembre',
      'Bouye (pain de singe)',
    ],
  },
  {
    id: 'poissons-fruits-mer',
    name: 'Poissons & Fruits de Mer',
    subcategories: [
      'Thiof (mérou)',
      'Yaboyé (sardinelles)',
      'Capitaine',
      'Dorade',
      'Crevettes',
      'Huîtres',
      'Poulpe',
      'Tilapia',
      'Carpe',
      'Poisson séché',
      'Poisson fumé',
    ],
  },
  {
    id: 'tubercules-racines',
    name: 'Tubercules & Racines',
    subcategories: [
      'Manioc',
      'Patates douces',
      'Ignames',
      'Pommes de terre',
      'Taro',
    ],
  },
];

export function getCategoryById(id: string): CategoryData | undefined {
  return CATEGORIES.find(cat => cat.id === id);
}

export function getCategoryByName(name: string): CategoryData | undefined {
  return CATEGORIES.find(cat => cat.name.toLowerCase() === name.toLowerCase());
}

export function getSubcategoriesForCategory(categoryName: string): string[] {
  const category = getCategoryByName(categoryName);
  return category ? category.subcategories : [];
}

export const SPECIALTY_TO_CATEGORY_MAP: Record<string, string[]> = {
  'Agriculteur / exploitant agricole': ['cereales-grains', 'fruits-legumes', 'produits-transformes'],
  'Riziculteur': ['cereales-grains'],
  'Producteur d\'arachide': ['cereales-grains'],
  'Maraîcher (tomate, oignon, chou, piment…)': ['fruits-legumes'],
  'Producteur de mil, sorgho, maïs': ['cereales-grains'],
  'Arboriculteur (mangue, agrumes, anacarde)': ['fruits-legumes'],
  'Producteur de coton ou de sésame': ['cereales-grains'],
  'Éleveur bovin (vaches, zébus)': ['betail-bovin'],
  'Éleveur ovin et caprin (moutons, chèvres)': ['petit-betail'],
  'Aviculteur (poules, poulets de chair, pondeuses)': ['volaille'],
  'Éleveur laitier': ['produits-laitiers'],
  'Apiculteur (production de miel)': ['produits-ruche'],
};

export function getCategoriesForSpecialty(specialty: string): string[] {
  return SPECIALTY_TO_CATEGORY_MAP[specialty] || [];
}

export function getCategoriesForSpecialties(specialties: string[]): string[] {
  const categoryIds = new Set<string>();
  specialties.forEach(specialty => {
    const cats = getCategoriesForSpecialty(specialty);
    cats.forEach(cat => categoryIds.add(cat));
  });
  return Array.from(categoryIds);
}
