import { IconType } from "react-icons";
import {
  BiSolidHome,
  BiSolidTreeAlt,
  BiSolidWater,
  BiSolidCrown,
  BiSolidCity,
} from "react-icons/bi";

export const categories = [
  {
    label: "Modern",
    icon: BiSolidHome,
    description: "Modern and contemporary homes",
  },
  {
    label: "Classic",
    icon: BiSolidCrown,
    description: "Classic and traditional properties",
  },
  {
    label: "Tropical",
    icon: BiSolidTreeAlt,
    description: "Tropical and beachside properties",
  },
  {
    label: "Countryside",
    icon: BiSolidTreeAlt,
    description: "Rural and countryside properties",
  },
  {
    label: "Urban",
    icon: BiSolidCity,
    description: "City and urban properties",
  },
  {
    label: "Lakeside",
    icon: BiSolidWater,
    description: "Properties near lakes and water",
  },
];

export const CATEGORY_OPTIONS = categories.map((category) => ({
  label: category.label,
  value: category.label,
}));

