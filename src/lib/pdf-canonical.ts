/**
 * Canonical strings from Steer Builders Company Profile PDF.
 * Used by the content reviewer agent to detect drift.
 */
export const pdfCanonical = {
  company: {
    name: "Steer Builders Corporation",
    mantra: "We help build your vision.",
    address: "Space 308 OneTree Plaza Hotel, R. Duterte St., Banawa, Cebu City",
    phone: "0917 149 4075",
    email: "info@steerbuilderscorporation.com",
  },
  story: {
    title: "Our Story",
    body: `We started as a sole proprietorship business in 2019 and started with fit-outs and glass works until we expanded to house renovation and construction before we incorporated in 2023. Our name echoes how we want to lead our clients towards their construction goals.`,
  },
  vision: {
    title: "Our Vision",
    body: `We envision to be the leading and preferred construction firm of homeowners as well as developers in Cebu and in the region. As we provide quality outputs and services, we envision to contribute to Cebu's economy by providing more jobs to our fellow Cebuanos.`,
  },
  mission: {
    title: "Our Mission",
    body: `We are committed to bring to life what our clients have visualized in life with our mantra, "We help build your vision." We work tirelessly from the conceptualization to the delivery of the finished product. We offer a very personal service with very hands-on engineers who ensure that the execution is in accordance to the plan.`,
  },
  services: [
    "Residential Design, Build and Renovation",
    "Commercial Design, Build and Renovation",
    "Interior Fit-outs",
    "Other Services (plumbing, electrical, tile, paint, ceiling, glass and metal works)",
    "Project Management and Consultation",
  ],
  management: [
    { name: "Engr. Mark Lester D. Isidro", title: "President & CEO" },
    { name: "Faye Charlotte A. Isidro, CPA", title: "Chief Financial Officer" },
  ],
  portfolioMinCount: 28,
} as const;
