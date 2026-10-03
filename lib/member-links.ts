import { teamMembers, alumni } from "@/app/data";

export const memberAnchor = (name: string) => `member-${name.toLowerCase().trim().replace(/\s+/g, "-")}`;
const normalize = (name: string) => name.toLowerCase().replace(/[\s*.-]/g, "");
const people = [
    { name: "Il Woong Park", nameKR: "박일웅", aliases: ["Il-Woong Park"] },
    ...teamMembers,
    ...alumni,
];
export function memberForAuthor(name: string) {
    const key = normalize(name);
    return people.find(person => [person.name, ...("aliases" in person ? person.aliases ?? [] : [])].some(alias => normalize(alias) === key));
}
