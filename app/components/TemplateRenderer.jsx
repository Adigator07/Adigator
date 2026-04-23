"use client";

import NewspaperTemplate from "./templates/NewspaperTemplate";
import EcommerceTemplate from "./templates/EcommerceTemplate";
import GamingTemplate from "./templates/GamingTemplate";
import HealthTemplate from "./templates/HealthTemplate";
import FoodTemplate from "./templates/FoodTemplate";
import TechnologyTemplate from "./templates/TechnologyTemplate";
import BusinessTemplate from "./templates/BusinessTemplate";
import EducationTemplate from "./templates/EducationTemplate";
import EntertainmentTemplate from "./templates/EntertainmentTemplate";

export default function TemplateRenderer({
  allSlots = [],
  activeSlotId,
  slotCreativeMap = {},
  showSlotLabels = false,
  isMobile = false,
  selectedTemplate = "newspaper", // Default
}) {
  // Group slots by zone
  const topSlots = allSlots.filter((s) => s.zone === "top");
  const leftSlots = allSlots.filter((s) => s.zone === "left");
  const rightSlots = allSlots.filter((s) => s.zone === "right");
  const contentSlots = allSlots.filter((s) => s.zone === "content");
  const bottomSlots = allSlots.filter((s) => s.zone === "bottom");

  const commonProps = {
    topSlots,
    leftSlots,
    rightSlots,
    contentSlots,
    bottomSlots,
    activeSlotId,
    slotCreativeMap,
    showSlotLabels,
    isMobile,
  };

  switch (selectedTemplate) {
    case "ecommerce":
      return <EcommerceTemplate {...commonProps} />;
    case "gaming":
      return <GamingTemplate {...commonProps} />;
    case "health":
      return <HealthTemplate {...commonProps} />;
    case "food":
      return <FoodTemplate {...commonProps} />;
    case "technology":
      return <TechnologyTemplate {...commonProps} />;
    case "business":
      return <BusinessTemplate {...commonProps} />;
    case "education":
      return <EducationTemplate {...commonProps} />;
    case "entertainment":
      return <EntertainmentTemplate {...commonProps} />;
    case "newspaper":
    default:
      return <NewspaperTemplate {...commonProps} />;
  }
}