export const company = {
  name: "Steer Builders Corporation",
  shortName: "SBC",
  mantra: "We help build your vision.",
  tagline: "Leading construction firm for homeowners and developers in Cebu and the region.",
  address: "Space 308 OneTree Plaza Hotel, R. Duterte St., Banawa, Cebu City",
  /** Google Maps search / open-in-app link */
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=OneTree+Plaza+Hotel+R.+Duterte+St+Banawa+Cebu+City",
  /** iframe embed (no API key) centered on the office building */
  mapsEmbedSrc:
    "https://www.google.com/maps?q=OneTree+Plaza+Hotel,+R.+Duterte+Street,+Banawa,+Cebu+City&hl=en&z=16&output=embed",
  phone: "0917 149 4075",
  phoneHref: "tel:+639171494075",
  email: "info@steerbuilderscorporation.com",
  emailHref: "mailto:info@steerbuilderscorporation.com",
  founded: 2019,
  incorporated: 2023,
} as const;

export const story = {
  title: "Our Story",
  body: `We started as a sole proprietorship business in 2019 and started with fit-outs and glass works until we expanded to house renovation and construction before we incorporated in 2023. Our name echoes how we want to lead our clients towards their construction goals.`,
};

export const vision = {
  title: "Our Vision",
  body: `We envision to be the leading and preferred construction firm of homeowners as well as developers in Cebu and in the region. As we provide quality outputs and services, we envision to contribute to Cebu's economy by providing more jobs to our fellow Cebuanos.`,
};

export const mission = {
  title: "Our Mission",
  body: `We are committed to bring to life what our clients have visualized in life with our mantra, "We help build your vision." We work tirelessly from the conceptualization to the delivery of the finished product. We offer a very personal service with very hands-on engineers who ensure that the execution is in accordance to the plan.`,
};

export const services = [
  {
    title: "Residential Design, Build and Renovation",
    description:
      "Custom homes, renovations, and residential developments — from concept to completion with hands-on engineering oversight.",
  },
  {
    title: "Commercial Design, Build and Renovation",
    description:
      "Shops, offices, clinics, warehouses, and commercial buildings delivered as general contractor for all-in works.",
  },
  {
    title: "Interior Fit-outs",
    description:
      "Condominium fit-outs, cabinetry, and interior finishing tailored to client specifications and timelines.",
  },
  {
    title: "Specialty Trades",
    description:
      "Plumbing, electrical, tile, paint, ceiling, glass and metal works — coordinated under one dependable team.",
  },
  {
    title: "Project Management and Consultation",
    description:
      "Project management, consultancy, and augmentation works for developers and property owners across Cebu and beyond.",
  },
];

export type PortfolioProject = {
  name: string;
  scope: string;
  location: string;
  status: string;
  completion: string;
  featured?: boolean;
  description?: string;
  category?: "completed" | "ongoing";
  /** Image URLs for project gallery */
  images?: string[];
};

export const portfolio: PortfolioProject[] = [
  { name: "Sunberry Homes 1 Subdivision", scope: "Project Management", location: "Soong, Mactan, Lapu-Lapu City", status: "Completed", completion: "2022" },
  { name: "Sunberry Homes 2 Subdivision", scope: "Project Management", location: "Sudtonggan, Basak, Lapu-Lapu City", status: "Completed", completion: "2022" },
  { name: "Toledo Medical Clinic", scope: "Project Consultant", location: "Bonifacio District, Panagdait, Mabolo, Cebu City", status: "Completed", completion: "2021" },
  { name: "Dorothea Commercial Shop", scope: "General Contractor (All-in works)", location: "Pusok, Lapu-Lapu City", status: "Completed", completion: "2020" },
  { name: "Ceburrific Pasalubong Shop", scope: "General Contractor (All-in works)", location: "Mactan Cebu International Airport", status: "Completed", completion: "2020" },
  { name: "Villa Azalea Subdivision", scope: "Contractor (Glass Installation)", location: "Cotcot, Liloan, Cebu", status: "Completed", completion: "2021" },
  { name: "Blanco Condo Renovation", scope: "General Contractor (All-in works)", location: "One Oasis Cebu, Mabolo, Cebu City", status: "Completed", completion: "2021" },
  { name: "Benitez Condo Renovation", scope: "General Contractor (All-in works)", location: "Horizons 101, General Maxilom Ave., Cebu City", status: "Completed", completion: "2022" },
  { name: "Dacles Residence", scope: "General Contractor (All-in works)", location: "Sangat, San Fernando", status: "Completed", completion: "2021", featured: true, category: "completed", description: "House construction delivered as general contractor with full coordination of trades and site execution." },
  { name: "JStore Innovation Worldwide Corporation Warehouse", scope: "General Contractor (All-in works)", location: "Canjulao, Lapu-Lapu City", status: "Completed", completion: "2019" },
  { name: "Saekyung Village Condominium Residences", scope: "Painting Contractor", location: "Marigondon, Beach Road, Marigondon, Lapu-Lapu City", status: "Completed", completion: "2022" },
  { name: "Ehrlich IT Services Inc. Office", scope: "General Contractor (All-in works)", location: "Cardoc Building, General Maxilom Ave., Cebu City", status: "Completed", completion: "2022" },
  { name: "Happy Tails Veterinary Clinic", scope: "General Contractor (All-in works)", location: "Labangon Tower Center, Cebu City", status: "Completed", completion: "2022" },
  { name: "Two-storey Commercial Building", scope: "General Contractor (All-in works)", location: "Brgy. Kasanta, Mactan, Lapu-Lapu City", status: "Completed", completion: "2023" },
  { name: "Two-storey Residential Building", scope: "General Contractor (All-in works)", location: "Brgy. Agus, Basak, Lapu-Lapu City", status: "Completed", completion: "2023" },
  { name: "MLhuillier Outlet", scope: "General Contractor (All-in works)", location: "Canduman, Mandaue City", status: "Completed", completion: "2024" },
  { name: "Beauty Blush Outlet", scope: "General Contractor (All-in works)", location: "Canduman, Mandaue City", status: "Completed", completion: "2024" },
  { name: "Tajanlangit Condo Renovation", scope: "General Contractor (All-in works)", location: "Bamboo Bay Residences, Hernan Cortes, Mandaue City", status: "Completed", completion: "2025" },
  { name: "Dr. Sanchez Residence", scope: "General Contractor (All-in works)", location: "St. Martin Heights, Guadalupe, Cebu City", status: "Completed", completion: "2024", featured: true, category: "completed", description: "A high-end private residence designed and constructed with premium finishes and meticulous attention to detail. The project required careful coordination of architectural elements and specialized trades to achieve the desired quality standards and refined interior aesthetics." },
  { name: "Sps. Zabala Royal Ocean Crest Condominium Fit-out", scope: "General Contractor (All-in works)", location: "Dauis, Bohol", status: "Completed", completion: "2025" },
  { name: "Caballero Residence", scope: "General Contractor (All-in works)", location: "Corella, Bohol", status: "Completed", completion: "Feb 2026", featured: true, category: "completed", description: "Steer Builders Corporation's first project outside Cebu — a one-storey senior-friendly residence in Corella, Bohol with practical layouts, accessibility considerations, and mid-range finishes built for long-term comfort and safety." },
  { name: "Sunberry Homes 2 Subdivision", scope: "Contractor (Cabinetry Works)", location: "Sudtonggan, Basak, Lapu-Lapu City", status: "Ongoing", completion: "Ongoing" },
  { name: "Ashana Coast Residences", scope: "General Contractor (Labor only)", location: "Catarman, Liloan, Cebu", status: "Ongoing", completion: "Ongoing", featured: true, category: "ongoing", description: "A residential housing development of two-storey units. Under a labor-only engagement, SBC handles manpower deployment and on-site construction execution for structural and architectural works." },
  { name: "Sweetberries Community", scope: "General Contractor (Labor only)", location: "Cambuhawe, Balamban, Cebu", status: "Ongoing", completion: "Ongoing", featured: true, category: "ongoing", description: "An ongoing residential development of multiple one-storey townhouse units. SBC provides full manpower and site execution services covering structural, architectural, and finishing works." },
  { name: "Esteem Medica Clinic Renovation", scope: "General Contractor (All-in works)", location: "Bamboo Bay Residences, Hernan Cortes, Mandaue City", status: "Put on hold in 2025", completion: "Put on hold in 2025" },
  { name: "Leyva Residences Renovation Works", scope: "General Contractor (All-in works)", location: "Tisa, Cebu City", status: "Ongoing", completion: "Ongoing" },
  { name: "Sunberry Homes Augmentation Works", scope: "General Contractor (Labor only)", location: "Brgy. Sudtunggan, Lapu-Lapu City, Cebu", status: "Ongoing", completion: "Ongoing" },
  { name: "Casa Mira Homes Iloilo Augmentation Works", scope: "General Contractor", location: "Brgy. Camalig, Jaro, Iloilo", status: "Ongoing", completion: "Ongoing", featured: true, category: "ongoing", description: "Residential housing development with labor-only augmentation works — manpower deployment and on-site execution in accordance with project plans and timelines." },
  { name: "Velmiro Heights Cagayan de Oro Augmentation Works", scope: "General Contractor", location: "Brgy. Agusan, Cagayan de Oro City", status: "Ongoing", completion: "Ongoing" },
  { name: "Velmiro Heights Cagayan de Oro House Construction (4 units)", scope: "General Contractor (All-in works)", location: "Brgy. Agusan, Cagayan de Oro City", status: "Ongoing", completion: "Ongoing" },
];

export const management = [
  {
    name: "Engr. Mark Lester D. Isidro",
    title: "President & CEO",
    bio: `Engr. Mark Lester Isidro is a licensed Civil Engineer with extensive experience in residential and horizontal development projects. He served as Project Engineer and later Project Manager at Sunberry Homes Inc. from 2016 to 2023, where he oversaw site execution, manpower coordination, and project delivery across multiple developments.

In 2019, he founded LEED Construction Services, a sole proprietorship handling various construction works including residential construction, apartment fit-outs, glass installation, and renovation projects. The growing portfolio and client base led to the incorporation of Steer Builders Corporation in 2023.

With both corporate and entrepreneurial experience, Engr. Isidro brings a practical, hands-on leadership style focused on quality workmanship, operational efficiency, and dependable client service.`,
  },
  {
    name: "Faye Charlotte A. Isidro, CPA",
    title: "Chief Financial Officer",
    bio: `Faye Charlotte Isidro is a Certified Public Accountant with a strong background in auditing, banking, and corporate finance. She began her career as an Audit Associate at SGV & Co. before joining a multinational bank, where she progressed from Internal Audit Specialist to Team Leader and later Corporate Credit Officer.

She subsequently served as Finance Director for a technology startup group of companies before focusing on her role as Chief Financial Officer of Steer Builders Corporation. Ms. Isidro leads the company's financial strategy, governance, and administrative systems, ensuring sound financial management and supporting sustainable business growth.`,
  },
];

export const proposalStats = [
  { value: "30+", label: "Projects in Portfolio" },
  { value: "2019", label: "Founded" },
  { value: "2023", label: "Incorporated" },
];
