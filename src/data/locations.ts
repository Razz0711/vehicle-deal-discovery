/**
 * All 28 states and 8 union territories of India.
 * City lists are a starter set of major cities per region, not a complete
 * gazetteer. Replace with an authoritative dataset before launch.
 */

export type Region = {
  code: string;
  name: string;
  type: "state" | "ut";
  cities: string[];
};

export const REGIONS: Region[] = [
  { code: "AP", name: "Andhra Pradesh", type: "state", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry", "Kakinada", "Anantapur"] },
  { code: "AR", name: "Arunachal Pradesh", type: "state", cities: ["Itanagar", "Naharlagun", "Pasighat", "Tawang"] },
  { code: "AS", name: "Assam", type: "state", cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur", "Nagaon"] },
  { code: "BR", name: "Bihar", type: "state", cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia"] },
  { code: "CG", name: "Chhattisgarh", type: "state", cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Raigarh"] },
  { code: "GA", name: "Goa", type: "state", cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"] },
  { code: "GJ", name: "Gujarat", type: "state", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Vapi", "Bharuch", "Mehsana", "Morbi", "Navsari", "Bhuj"] },
  { code: "HR", name: "Haryana", type: "state", cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Sonipat"] },
  { code: "HP", name: "Himachal Pradesh", type: "state", cities: ["Shimla", "Mandi", "Solan", "Dharamshala", "Kullu"] },
  { code: "JH", name: "Jharkhand", type: "state", cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"] },
  { code: "KA", name: "Karnataka", type: "state", cities: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Kalaburagi", "Davanagere", "Shivamogga", "Udupi"] },
  { code: "KL", name: "Kerala", type: "state", cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Kottayam", "Palakkad"] },
  { code: "MP", name: "Madhya Pradesh", type: "state", cities: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Rewa"] },
  { code: "MH", name: "Maharashtra", type: "state", cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Navi Mumbai", "Chhatrapati Sambhajinagar", "Kolhapur", "Solapur", "Amravati"] },
  { code: "MN", name: "Manipur", type: "state", cities: ["Imphal", "Thoubal", "Churachandpur"] },
  { code: "ML", name: "Meghalaya", type: "state", cities: ["Shillong", "Tura", "Jowai"] },
  { code: "MZ", name: "Mizoram", type: "state", cities: ["Aizawl", "Lunglei"] },
  { code: "NL", name: "Nagaland", type: "state", cities: ["Kohima", "Dimapur", "Mokokchung"] },
  { code: "OD", name: "Odisha", type: "state", cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Berhampur", "Puri"] },
  { code: "PB", name: "Punjab", type: "state", cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"] },
  { code: "RJ", name: "Rajasthan", type: "state", cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar"] },
  { code: "SK", name: "Sikkim", type: "state", cities: ["Gangtok", "Namchi"] },
  { code: "TN", name: "Tamil Nadu", type: "state", cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Tiruppur"] },
  { code: "TG", name: "Telangana", type: "state", cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"] },
  { code: "TR", name: "Tripura", type: "state", cities: ["Agartala", "Dharmanagar"] },
  { code: "UP", name: "Uttar Pradesh", type: "state", cities: ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi", "Prayagraj", "Meerut", "Bareilly", "Gorakhpur", "Aligarh"] },
  { code: "UK", name: "Uttarakhand", type: "state", cities: ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Rudrapur"] },
  { code: "WB", name: "West Bengal", type: "state", cities: ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Kharagpur"] },
  { code: "AN", name: "Andaman and Nicobar Islands", type: "ut", cities: ["Sri Vijaya Puram (Port Blair)"] },
  { code: "CH", name: "Chandigarh", type: "ut", cities: ["Chandigarh"] },
  { code: "DH", name: "Dadra and Nagar Haveli and Daman and Diu", type: "ut", cities: ["Daman", "Diu", "Silvassa"] },
  { code: "DL", name: "Delhi", type: "ut", cities: ["New Delhi", "Delhi"] },
  { code: "JK", name: "Jammu and Kashmir", type: "ut", cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla"] },
  { code: "LA", name: "Ladakh", type: "ut", cities: ["Leh", "Kargil"] },
  { code: "LD", name: "Lakshadweep", type: "ut", cities: ["Kavaratti"] },
  { code: "PY", name: "Puducherry", type: "ut", cities: ["Puducherry", "Karaikal"] },
];

export function getRegion(code: string): Region | undefined {
  return REGIONS.find((r) => r.code === code);
}
