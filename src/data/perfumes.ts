import citrusImg from "@/assets/collection-citrus.jpg";
import santoriniImg from "@/assets/collection-santorini.jpg";
import sunsetImg from "@/assets/collection-sunset.jpg";
import yachtImg from "@/assets/collection-yacht.jpg";
import roseImg from "@/assets/collection-rose.jpg";

export interface Perfume {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  category: "signature" | "intense" | "fresh" | "floral";
  categoryLabel: string;
  image: string;
  description: string;
  size: string;
  notes: {
    head: string;
    heart: string;
    base: string;
  };
  rating: number;
  badge?: string;
}

export const perfumes: Perfume[] = [
  {
    id: "ishq-signature",
    name: "ISHQ Signature",
    subtitle: "Huile de Parfum Originelle",
    price: 89,
    category: "signature",
    categoryLabel: "Signature",
    image: santoriniImg,
    description: "Une composition orientale moderne où le jasmin de Grasse rencontre l'ambre précieux. Une huile sans alcool, intime sur la peau, qui se révèle au fil des heures comme un secret murmuré.",
    size: "10 ml · Roll-on",
    notes: {
      head: "Bergamote, Néroli",
      heart: "Jasmin de Grasse, Rose de Damas",
      base: "Ambre chaud, Oud royal, Musc Blanc"
    },
    rating: 5,
    badge: "Bestseller"
  },
  {
    id: "ishq-soleil",
    name: "Soleil d'Oranger",
    subtitle: "Huile de Parfum Ensoleillée",
    price: 89,
    category: "fresh",
    categoryLabel: "Frais",
    image: citrusImg,
    description: "Un sillage hespéridé et floral évoquant les vergers ensoleillés de Méditerranée. La fraîcheur des agrumes s'harmonise délicatement avec la douceur de la fleur d'oranger.",
    size: "10 ml · Roll-on",
    notes: {
      head: "Bergamote, Citron Vert, Mandarine",
      heart: "Fleur d'Oranger, Néroli des Cyclades",
      base: "Musc Blanc, Ambre doux"
    },
    rating: 4.9,
    badge: "Nouveauté"
  },
  {
    id: "ishq-sunset",
    name: "Sunset Club",
    subtitle: "Huile de Parfum Crépusculaire",
    price: 95,
    category: "intense",
    categoryLabel: "Intense",
    image: sunsetImg,
    description: "Une fragrance sophistiquée célébrant l'élégance de la golden hour. L'effervescence d'un accord festif se fond dans la sensualité d'un jasmin nocturne et d'un ambre précieux.",
    size: "10 ml · Roll-on",
    notes: {
      head: "Champagne Pétillant, Accord Fruité",
      heart: "Jasmin de Nuit, Poivre Rose",
      base: "Bois de Cachemire, Ambre Précieux"
    },
    rating: 5,
    badge: "Édition Limitée"
  },
  {
    id: "ishq-yachting",
    name: "Yachting Club",
    subtitle: "Huile de Parfum Marine",
    price: 95,
    category: "fresh",
    categoryLabel: "Frais",
    image: yachtImg,
    description: "L'esprit d'une escapade à bord d'un yacht au large des îles grecques. La pureté d'une brise saline et iodée s'allie à la noblesse du bois flotté et de la sauge.",
    size: "10 ml · Roll-on",
    notes: {
      head: "Brise Saline, Mandarine Italienne",
      heart: "Accord Marin, Sauge Sclatée",
      base: "Bois Flotté, Vétiver Sauvage"
    },
    rating: 4.8
  },
  {
    id: "ishq-bouquet",
    name: "Bouquet de Soie",
    subtitle: "Huile de Parfum Florale",
    price: 98,
    category: "floral",
    categoryLabel: "Floral",
    image: roseImg,
    description: "Un voile poudré d'une extrême féminité. La délicatesse des pétales de rose et de l'iris de Florence se dépose sur la peau comme une caresse de soie pure.",
    size: "10 ml · Roll-on",
    notes: {
      head: "Pétales de Rose, Mandarine douce",
      heart: "Iris de Florence, Rose de Mai, Jasmin",
      base: "Santal Crémeux, Musc Blanc"
    },
    rating: 4.9,
    badge: "Coup de Cœur"
  }
];
