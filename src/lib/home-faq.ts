import type { Area } from './data';

// Home FAQ copy (PLAN 6.9). Answers may use [text](/path) inline links; the FAQPage JSON-LD uses stripInline() so it equals the visible text.
// No phone number in the answers (rule 9: numbers are always links); the section's Call and Text buttons sit beside the list.
// Q22 (does Miguel move furniture?) is unanswered, so question 5 makes no furniture-moving claim.
export function homeFaq(areas: Pick<Area, 'name'>[]): { q: string; a: string }[] {
  const names = areas.map((a) => a.name);
  const list = `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return [
    {
      q: 'How do I get a free estimate?',
      a: 'Call or text us. Texting photos of the area with your ZIP code is the fastest way, and Miguel replies with an estimate.'
    },
    {
      q: 'Can I just text photos instead of calling?',
      a: 'Yes. Send a wide shot of the room or area, close-ups of any stains or problem spots, and the care tag if it is upholstery. Add your ZIP code and a note about what you want cleaned, and Miguel will reply with an estimate.'
    },
    {
      q: 'What areas do you serve?',
      a: `We serve the whole Las Vegas Valley, including ${list}. If you're nearby and not listed, text us anyway.`
    },
    {
      q: 'Do you only clean carpet?',
      a: 'No. Besides [carpet cleaning](/services/carpet-cleaning), we clean rugs, upholstery, tile and grout, and we handle water extraction, pressure washing, driveways and garages. Read more about [upholstery cleaning](/services/upholstery-cleaning), [tile cleaning](/services/tile-cleaning) and [pressure washing](/services/pressure-washing), or see [all services](/services).'
    },
    {
      q: 'How should I get my home ready?',
      a: 'Pick up small items and anything fragile from the floor, secure pets, and note any problem spots. Mention large furniture in your text so it can be factored into your estimate.'
    },
    {
      q: 'How long does carpet take to dry?',
      a: "It depends on the carpet type, how soiled it is and the airflow in your home. You'll get drying tips after cleaning."
    }
  ];
}
