import type { Database } from "@/integrations/supabase/types";

type LeadSource = Database["public"]["Tables"]["leads"]["Row"]["source"];
type LeadStatus = Database["public"]["Tables"]["leads"]["Row"]["status"];

export const DEMO_LEADS: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  source: LeadSource;
  status: LeadStatus;
}[] = [
  { customer_name: "Yael Cohen", customer_phone: "+972-50-111-2233", customer_email: "yael.c@example.com", source: "instagram", status: "new" },
  { customer_name: "David Levi", customer_phone: "+972-52-222-3344", customer_email: "d.levi@example.com", source: "website", status: "new" },
  { customer_name: "Sarah Mizrahi", customer_phone: "+972-54-333-4455", source: "architects", status: "new" },
  { customer_name: "Michael Ben-David", customer_phone: "+972-50-444-5566", customer_email: "michael.bd@example.com", source: "organic", status: "new" },
  { customer_name: "Rachel Avraham", customer_phone: "+972-52-555-6677", source: "facebook", status: "new" },
  { customer_name: "Jonathan Shapira", customer_phone: "+972-54-666-7788", customer_email: "j.shapira@example.com", source: "instagram", status: "new" },
  { customer_name: "Noa Goldstein", customer_phone: "+972-50-777-8899", source: "website", status: "new" },
  { customer_name: "Eitan Friedman", customer_phone: "+972-52-888-9900", customer_email: "eitan.f@example.com", source: "architects", status: "new" },
  { customer_name: "Maya Rosen", customer_phone: "+972-54-999-0011", source: "organic", status: "new" },
  { customer_name: "Oren Baruch", customer_phone: "+972-50-100-2234", customer_email: "oren.b@example.com", source: "facebook", status: "new" },
  { customer_name: "Tamar Dahan", customer_phone: "+972-52-201-3345", source: "instagram", status: "new" },
  { customer_name: "Itamar Golan", customer_phone: "+972-54-302-4456", customer_email: "itamar.g@example.com", source: "website", status: "new" },
  { customer_name: "Lior Peretz", customer_phone: "+972-50-403-5567", source: "architects", status: "in_process" },
  { customer_name: "Shira Kaufman", customer_phone: "+972-52-504-6678", customer_email: "shira.k@example.com", source: "organic", status: "in_process" },
  { customer_name: "Nir Azoulay", customer_phone: "+972-54-605-7789", source: "facebook", status: "in_process" },
  { customer_name: "Hila Barkan", customer_phone: "+972-50-706-8890", customer_email: "hila.b@example.com", source: "instagram", status: "in_process" },
  { customer_name: "Guy Meir", customer_phone: "+972-52-807-9901", source: "website", status: "in_process" },
  { customer_name: "Roni Adler", customer_phone: "+972-54-908-0012", customer_email: "roni.a@example.com", source: "architects", status: "in_process" },
  { customer_name: "Tal Carmi", customer_phone: "+972-50-009-1123", source: "organic", status: "in_process" },
  { customer_name: "Yoni Segal", customer_phone: "+972-52-110-2234", customer_email: "yoni.s@example.com", source: "facebook", status: "in_process" },
  { customer_name: "Dana Weiss", customer_phone: "+972-54-211-3345", source: "instagram", status: "in_process" },
  { customer_name: "Amir Biton", customer_phone: "+972-50-312-4456", customer_email: "amir.b@example.com", source: "website", status: "in_process" },
  { customer_name: "Keren Haim", customer_phone: "+972-52-413-5567", source: "architects", status: "in_process" },
  { customer_name: "Roi Ashkenazi", customer_phone: "+972-54-514-6678", customer_email: "roi.a@example.com", source: "organic", status: "in_process" },
  { customer_name: "Eden Shalom", customer_phone: "+972-50-615-7789", source: "facebook", status: "meeting_scheduled" },
  { customer_name: "Ido Malka", customer_phone: "+972-52-716-8890", customer_email: "ido.m@example.com", source: "instagram", status: "meeting_scheduled" },
  { customer_name: "Lihi Brody", customer_phone: "+972-54-817-9901", source: "website", status: "meeting_scheduled" },
  { customer_name: "Yuval Gabbay", customer_phone: "+972-50-918-0012", customer_email: "yuval.g@example.com", source: "architects", status: "meeting_scheduled" },
  { customer_name: "Noga Stern", customer_phone: "+972-52-019-1123", source: "organic", status: "meeting_scheduled" },
  { customer_name: "Erez Cohen", customer_phone: "+972-54-120-2234", customer_email: "erez.c@example.com", source: "facebook", status: "meeting_scheduled" },
  { customer_name: "Michal Dor", customer_phone: "+972-50-221-3345", source: "instagram", status: "meeting_scheduled" },
  { customer_name: "Aviad Zohar", customer_phone: "+972-52-322-4456", customer_email: "aviad.z@example.com", source: "website", status: "meeting_scheduled" },
  { customer_name: "Shani Reuven", customer_phone: "+972-54-423-5567", source: "architects", status: "meeting_done" },
  { customer_name: "Barak Erez", customer_phone: "+972-50-524-6678", customer_email: "barak.e@example.com", source: "organic", status: "meeting_done" },
  { customer_name: "Galit Ohayon", customer_phone: "+972-52-625-7789", source: "facebook", status: "meeting_done" },
  { customer_name: "Danielle Ben-Ami", customer_phone: "+972-54-726-8890", customer_email: "danielle.ba@example.com", source: "instagram", status: "meeting_done" },
  { customer_name: "Omer Tal", customer_phone: "+972-50-827-9901", source: "website", status: "meeting_done" },
  { customer_name: "Adi Cohen", customer_phone: "+972-52-928-0012", customer_email: "adi.c@example.com", source: "architects", status: "waiting_for_approval" },
  { customer_name: "Ran Levi", customer_phone: "+972-54-029-1123", source: "organic", status: "waiting_for_approval" },
  { customer_name: "Mor Dror", customer_phone: "+972-50-130-2234", customer_email: "mor.d@example.com", source: "facebook", status: "waiting_for_approval" },
  { customer_name: "Shaked Ben-David", customer_phone: "+972-52-241-3345", source: "instagram", status: "waiting_for_approval" },
  { customer_name: "Tom Gefen", customer_phone: "+972-54-352-4456", customer_email: "tom.g@example.com", source: "website", status: "waiting_for_approval" },
  { customer_name: "Liat Harari", customer_phone: "+972-50-463-5567", customer_email: "liat.h@example.com", source: "architects", status: "done" },
  { customer_name: "Gilad Katz", customer_phone: "+972-52-574-6678", source: "organic", status: "done" },
  { customer_name: "Rivka Abramov", customer_phone: "+972-54-685-7789", customer_email: "rivka.a@example.com", source: "facebook", status: "done" },
  { customer_name: "Asaf Rubin", customer_phone: "+972-50-796-8890", source: "instagram", status: "done" },
  { customer_name: "Tali Gross", customer_phone: "+972-52-807-9901", customer_email: "tali.g@example.com", source: "website", status: "done" },
  { customer_name: "Uri Shalev", customer_phone: "+972-54-918-0012", source: "architects", status: "not_done" },
  { customer_name: "Neta Ben-Shalom", customer_phone: "+972-50-029-1123", customer_email: "neta.bs@example.com", source: "organic", status: "not_done" },
  { customer_name: "Eyal Maman", customer_phone: "+972-52-130-2234", source: "facebook", status: "not_done" },
  { customer_name: "Inbar Sade", customer_phone: "+972-54-241-3345", customer_email: "inbar.s@example.com", source: "instagram", status: "not_done" },
  { customer_name: "Yogev Dagan", customer_phone: "+972-50-352-4456", source: "website", status: "not_done" },
];
