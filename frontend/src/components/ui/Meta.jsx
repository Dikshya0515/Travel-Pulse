import { Helmet } from "react-helmet-async";

export default function Meta({ title, description, keywords }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
    </Helmet>
  );
}

Meta.defaultProps = {
  title: "TravelPulse | Exciting tours for adventurous people",
  description:
    "Book tickets at cheapest prices. Exciting discounts on famous tours.",
  keywords: "adventure, hiking, sea, snow, city, explorer, forest, mountain",
};
