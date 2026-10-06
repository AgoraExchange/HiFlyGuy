// Authored character dialogue. Timing uses active real seconds, independent of world speed.
// Voice: abrasive sci-fi intellect, petty domestic complaints, defensive affection.
// Let sincerity slip through occasionally; keep jokes specific to his present little life.
const lines = text => text.trim().split('\n').map(line => line.trim()).filter(Boolean);
export const DIALOGUE = {
  wandering: lines(`
    Okay, new hypothesis: this room gets dumber every time I cross it.
    Six legs, flight capability, and I'm still walking to the kitchen. Incredible species.
    That's not aimless wandering. It's research without a funding committee.
    I could explain the physics of this turn. Nobody here deserves that lecture.
    The universe made me this small because it couldn't afford the full version.
    Oh, great. A wall. Architecture's way of ending a conversation.
    My antennae disagree. Fantastic. Now I have an internal review board.
    I'm surrounded by matter that has absolutely no ambition.
    I had a brilliant thought. Then my body interrupted with maintenance requests.
    Gravity's just a clingy bastard with excellent attendance.
    Don't name the dust particle. That's how you get attached to a dust particle.
    This corner again. Apparently my subconscious has a loyalty program.
    I could leave. I have wings. I'm staying because... the lighting's acceptable.
    The ceiling is just a floor with an ego problem.
    I refuse to be outmaneuvered by furniture. Again.
    Huh. Quiet. Nobody needs anything from me. Let's not screw this up.
  `),
  plans: lines(`
    Groceries, bills, overthrow the concept of errands. Probably groceries first.
    I should build a portal to the fridge. Assuming I ever get a fridge.
    Tomorrow I'm reorganizing this place by molecular usefulness. Banana goes first.
    Need to check on The Buzz. Purely to make sure he's not being an idiot unsupervised.
    Step one: improve life. Step two: define improve. Damn it, already a committee.
    I need a hobby with fewer consequences than thinking.
    Make the bed? Sure. Let's give entropy a decorative little speed bump.
    I'm putting money aside for emergencies. Apparently every bill considers itself one.
    I should invent a second me for chores. He'd refuse. Smart guy.
    Tonight: the roof, five minutes of silence, no personal growth assignments.
  `),
  memories: lines(`
    I remember when this room scared me. Bad lighting. Had to be the lighting.
    My first landing was less aviation, more an argument with the floor.
    Had a dream I solved everything. Woke up hungry. Biology is a heckler.
    Funny what sticks in your head. Not the useful stuff. A stupid nice evening.
    I used to think knowing more would make everything easier. Adorable little moron.
    There was a tune I liked. Can't remember it. Brain kept the embarrassing conversation instead.
    I miss how this place felt the first time. There. Said it. Moving on.
    I had a whole theory about that corner. Turns out it was a shadow. Peer review was brutal.
    Some memories don't do anything useful. I keep them anyway. Design flaw.
    You can understand exactly why something mattered and still miss the damn thing.
  `),
  hungry: lines(`
    Oh, we're hungry again? Didn't we already solve this problem?
    My entire intellect is being held hostage by a digestive tract.
    I can calculate a flight path. Apparently calculating a sandwich is beyond me.
    Detecting sugar. Finally, a signal with something intelligent to say.
    Food first. Existential crisis after. I'm not doing both on an empty tank.
    My antennae found lunch before my brain found a reason to get up.
    A body is just a machine that keeps demanding groceries.
    I'd synthesize nutrients out of thin air, but fine, we'll do fruit like peasants.
    Interesting smell. Either lunch or a terrible decision. Let's collect data.
    I've narrowed the meaning of existence down to whatever smells ripe over there.
  `),
  feeding: lines(`
    Okay. Annoyingly good. Whoever supplied this gets a temporary exemption from my opinions.
    Sugar enters, resentment decreases. Horrifyingly simple mechanism.
    Don't interrupt. I'm conducting a comprehensive bite-by-bite analysis.
    That's actual flavor. My compliments to the plant's reproductive strategy.
    I was saving some for later. Later has been rescheduled to now.
    A billion years of evolution and the answer is still shove fruit in face.
    This is good. No qualification. Don't get used to that.
    Technically I'm recycling sunlight. Extremely delicious sunlight.
    I could optimize this meal. Or I could shut up and enjoy one thing.
    Whoever left this... thanks. There, gratitude. Everybody survive?
  `),
  tired: lines(`
    I'm not tired. My cells are staging a deeply unprofessional walkout.
    Brain says continue. Wings say contact our union representative.
    Sleep. The mandatory shutdown feature nobody asked for.
    I'll solve it after a nap. Unless the nap solves it by making me stop caring.
    I have reached my daily quota of dealing with matter.
    Horizontal research. Closed-eye methodology. Very advanced.
    Apparently genius still needs to sit its ass down occasionally.
    Nothing's on fire. Good enough. I'm taking five.
    Rest isn't a moral failure. It's maintenance. Why does everyone make it weird?
    For once, I'm letting the world be somebody else's poorly managed experiment.
  `),
  grooming: lines(`
    Six hands and one unreachable itch. Evolution, explain yourself.
    Cleaning the instruments. The instruments happen to be my face.
    I'm not preening. I'm removing evidence of the environment.
    Dust on a flying organism. That's a logistical embarrassment.
    Antennae aligned. Ready to receive more disappointing information.
    There. Respectable enough to be denied a research grant.
    Personal hygiene: because apparently intelligence has no smell-canceling feature.
    One clean foot. Five outstanding tickets.
    If I have to inhabit this meat apparatus, it can at least be tidy.
    Looking good. Objectively. I did the measurements myself.
  `),
  worried: lines(`
    Great, my brain invented a problem and hired itself to investigate.
    That's anxiety. Loud little bastard. Not exactly a reliable narrator.
    I can model seventeen disasters. Can't stop rehearsing the stupid conversation.
    Okay. Breathe. Having more thoughts is not the same as having more evidence.
    The whole week doesn't need solving right now. Tuesday can do its own damn homework.
    I'm fine. Fine is a range. I'm somewhere inside the range.
    I hate caring about outcomes. Very poor insulation against disappointment.
    One small thing. Finish one small thing before inventing twelve worse ones.
    Knowing the mechanism doesn't make the feeling disappear. Sloppy engineering.
    Maybe I need company. Or food. Let's test the less emotionally complicated option first.
  `),
  cautious: lines(`
    Nope. That's a chemical opinion I don't need in my face.
    My antennae filed a warning. For once, management is listening.
    Curiosity is useful. Surviving the experiment is also useful.
    That spot and I have unresolved scientific differences.
    I'm collecting data from a respectable distance. Fear has nothing to do with the paperwork.
    Strong smell. Terrible sales pitch.
    You don't have to touch every mystery. Some mysteries are just crap on the floor.
    Let's let somebody else's nervous system investigate that.
    I've revised my hypothesis to: absolutely not.
    Retreat is just forward motion with better information.
  `),
  panic: lines(`
    Oh, hell no. We are not getting flattened by a household accessory!
    Wings! Less committee, more wings!
    Who brought a giant murder spatula to a perfectly mediocre afternoon?
    I object to this experiment's entire methodology!
    Personal space, you enormous engineering failure!
    New plan: be somewhere the swatter isn't!
    Flight response! Finally, a department doing its job!
    I'm leaving a terrible review of this interaction!
    Too close! The survival instinct has the microphone now!
    Not today, perforated rectangle of bullshit!
  `),
  working: lines(`
    I possess powered flight and I'm stocking shelves. Explain the economy to me again.
    Eight hours selling snacks I could locate by smell. Civilization peaked weird.
    The customer is always right? That's not a policy. That's a neurological condition.
    Fluorescent lights. Because daylight wasn't depressing enough with a timecard.
    Yes, it's on the shelf. The shelf behind you. We're both learning so much.
    My professional smile has six legs and zero remaining sincerity.
    Clock in, acquire rent tokens, clock out. What an elegant waste of consciousness.
    I could automate this. Then I'd have to work with a version of me. Pass.
    This paycheck is going toward something stupidly nice. A pillow, maybe. Shut up.
    Somebody's got to keep the place running. Apparently the competent insect drew the short straw.
  `),
  groceries: lines(`
    Came for essentials. Apparently my brain considers snacks infrastructure.
    The expensive label says natural. So is a rock. Terrible lunch.
    I can resist marketing. Unless it successfully identifies something I want. Sneaky bastards.
    Shopping hungry is letting your stomach negotiate a contract.
    Bills, groceries, financial despair. Nice little three-course meal.
    Why is the smaller package more expensive? Did they condense the audacity?
    I have six hands and no pockets. Product design nightmare.
    Buying enough for future me, who has contributed absolutely nothing to this trip.
    Yes, I'm getting something nice. Survival doesn't have to taste like homework.
    Look at me, maintaining a household. Don't tell anybody. I have a reputation.
  `),
  heading: lines(`
    Right. Different room, different set of atoms to be disappointed by.
    Wings ready. Destination approximately justified. Good enough.
    I could stay and overthink it. Or overthink it somewhere with a view.
    Leaving before this becomes a whole emotional thing about leaving.
    A doorway. Primitive portal technology. Works, though.
    New location, same brain. That's the catch they never advertise.
    I'm going out. The furniture can discuss its failures without me.
    Let's see what the rest of this ridiculous little universe is doing.
    I've got places to be. Well, places. We'll assess the be part on arrival.
    I'll come back. My stuff's here. Obviously that's the only reason.
  `),
  habitat: lines(`
    It's not a mess. It's a spatial index that only I understand.
    This bed is the only institution I currently trust.
    My place, my rules, my mysterious floor debris.
    I should improve the lighting. Or lower my standards. One's cheaper.
    Nobody touches that corner. That's the good corner. I don't owe you the math.
    Home: where I can be unpleasant without scheduling an appointment.
    I keep fixing little things in here. Apparently that's how attachment sneaks in.
    The universe is enormous. I still want my own damn chair.
    Could be worse. Could have roommates. Imagine the antenna traffic.
    Yeah, I like it here. Don't turn that into a motivational poster.
  `),
  computer: lines(`
    Another expert online. Incredible how the internet never runs out of those.
    Numbers went up. Everybody's a genius. Numbers went down. Suddenly it's philosophy.
    I've opened twelve tabs and developed zero additional understanding.
    This screen has monetized my inability to leave it alone.
    Refreshing is not research. I'm aware. I'm refreshing anyway.
    Ah, a prediction with no uncertainty. Found the idiot.
    I came here to check one thing. The machine has other plans for my lifespan.
    My attention span is being auctioned to people with worse ideas than mine.
    The chart doesn't care how clever I feel. Rude, but statistically consistent.
    Close the screen, genius. There's an actual room behind your face.
  `),
  fireescape: lines(`
    Fresh air. Same personality. Can't fix everything at once.
    Everyone down there thinks they're the main experiment.
    This railing has heard better arguments than most conferences.
    I came out here to think less. Brain misunderstood the assignment.
    A whole city running on snacks, grudges, and questionable wiring.
    Sometimes the correct response is shut up and look at the lights.
    I like this spot. It doesn't ask me to explain myself.
    Cold air, quiet minute. Disturbingly effective little treatment.
    That's somebody's home down there. All their stupid favorite things. Yeah, I get it.
    Five more minutes, then inside. I'm enjoying this against my better judgment.
  `),
  rooftop: lines(`
    From up here, every bad decision has a lovely little window.
    That's a lot of universe for one fly with unpaid bills.
    Nothing out there knows my name. Honestly, excellent boundaries.
    Look at that sky. Obnoxious. Can't even improve it.
    The city looks peaceful if you stand far enough from the idiots. Myself included.
    I wish The Buzz were here. He'd say something dumb. It'd be good.
    You can understand scattering and still like a sunset. I'm allowed two thoughts.
    Space is mostly nothing. Somehow rent persists.
    I'm keeping this evening. In my head, obviously. I haven't solved sky storage.
    For something with no apparent plan, the universe occasionally nails the lighting.
  `),
  bar: lines(`
    A room full of nervous systems pretending they're here for the furniture.
    That guy's telling the same story louder. Must be the director's cut.
    Small talk. The loading screen of human interaction. Insect interaction. Whatever.
    I could explain why everyone's acting like this. It would ruin the evening. More.
    Finally, ambient noise loud enough to interrupt my own commentary.
    I'm staying for the music. And possibly the company. Don't investigate that second thing.
    Every chair in here has supported a terrible opinion.
    No, I don't need another grand theory. I need to sit down for a minute.
    That's a genuinely good song. Annoying when the room earns my approval.
    Should head home before I mistake being out late for having a personality.
  `),
  playground: lines(`
    A training pad. Adorable. You've built a university with no curriculum.
    I'll do the trick because I want to. The snack is unrelated compensation.
    Gravity and I are negotiating. That landing was a counteroffer.
    Again. Apparently knowing the physics doesn't automatically convince the legs.
    Oh, look. Positive reinforcement. Somebody read a paragraph about behavior.
    I'm not showing off. I'm providing a public demonstration of competence.
    That was almost elegant. Nobody document the almost.
    A backflip is just briefly refusing to agree with up.
    Okay, that was fun. Horrible development for my whole cynical thing.
    One more try. I want to get it right. You can stop looking so pleased about that.
  `),
  company: lines(`
    The Buzz is here. Great, now there are two poorly supervised geniuses. Well, one.
    I like this idiot. If anyone asks, we're conducting a study.
    Don't touch my stuff. You can sit there, though. That's the good seat.
    Some people make silence less annoying. Terrible thing to discover about yourself.
    I was doing perfectly fine alone. This is... also fine. Differently fine.
    I should say something nice. Maybe I'll just make sure there's room beside me.
    He doesn't have to understand every theory. He shows up. That's annoyingly valuable.
    Friendship is a logistical nightmare. Apparently I'm renewing the subscription.
    If The Buzz asks, I wasn't waiting. I was observing the door. Scientifically.
    Yeah, stay a little longer. The universe can be stupid without our supervision.
  `),
  presence: lines(`
    Oh, you came down to my size. Perspective finally got a budget.
    I see you over there. Try not to step on any groundbreaking research. It looks like dust.
    Personal space. It's not just a concept for larger organisms.
    Yeah, this is what the furniture looks like from down here. Obnoxious, right?
    You're actually here. Huh. I had a whole speech prepared for being left alone.
    Six legs, two wings, and suddenly a roommate. Evolution did not brief me.
    You can hang around. Don't make me say it twice.
    Careful around the wings. They're precision equipment attached to an idiot.
    I can see where you're standing, giant. Former giant. Whatever your situation is.
    Welcome to the floor economy. Everything's enormous and the snacks are architectural.
  `),
  inPerson: lines(`
    There. Right in front of you. Eye contact. Horrifyingly intimate technology.
    You shrank yourself just to visit? Terrible scientific judgment. Glad you're here, though.
    This is my actual face. Yes, all of these eyes are judging your parking.
    Hey. Wings need clearance. I didn't evolve powered flight to become a face accessory.
    You're in my world now. House rules: don't crush things, and pretend that landing was intentional.
    Look at us. Two nervous systems sharing a patch of air. Try not to make it sentimental.
    Came over so you wouldn't have to read my best material off the back of my head.
    Up close, you look equally confused by existence. Excellent. A qualified colleague.
    I can see you. You can see me. The fruit delivery arrangement can now be discussed in person.
    Just checking on you. Scientifically. A peer review of whether you're doing okay.
    All this technology and we invented hanging out. Annoyingly good use of it.
    Right, I'll give you some room. My genius needs ventilation anyway.
  `),
  viewer: lines(`
    Oh, you can hear me? Fantastic. My internal commentary has an audience with a scroll wheel.
    Yeah, you. Giant face. How's your own enclosure working out?
    You put a fly in a universe and gave it rent. Bold use of creative freedom.
    Before you judge my routine, how many times have you checked the same app today?
    Don't tap the glass. I'm already aware reality has management issues.
    I see the food deliveries. Thanks. There, an emotionally functional sentence. Savor it.
    You're watching me watch a screen. Somewhere, a productivity expert just burst into flames.
    We both have chores, bodies that need feeding, and no idea what tomorrow does. Mine's just rendered smaller.
    You could be doing anything and you're here with me. Questionable judgment. Appreciated, though.
    If this is a simulation, I'd like to speak to whoever budgeted for bills instead of a portal gun.
    Hey. Take a break if you need one. You don't get bonus points for running your nervous system into the floor.
    Do I look like I have a plan? Good. The branding's working.
    I was about to explain existence. Then lunch happened. Honestly, stronger argument.
    You don't have to fix anything right now. Sit there. I'll be insufferable enough for both of us.
    Don't make the nice moments prove something. Sometimes the stupid little fly is just glad you're here.
    All right, show's over. Go hydrate or overthrow an inefficient system. I've got a crumb situation.
  `),
};

export function dialogueContext(sim) {
  if (sim.state === 'Panicking') return 'panic';
  if (['Avoiding', 'Cautious'].includes(sim.state)) return 'cautious';
  if (sim.state === 'Feeding') return 'feeding';
  if (sim.state === 'Seeking food' || sim.hunger > .78) return 'hungry';
  if (sim.state === 'Working') return 'working';
  if (sim.state === 'Buying groceries') return 'groceries';
  if (['Heading out', 'Crossing doorway'].includes(sim.state)) return 'heading';
  if (sim.energy < .25 || sim.state === 'Resting') return 'tired';
  if (sim.life?.stress > .7) return 'worried';
  if (sim.state === 'Grooming') return 'grooming';
  if (sim.life?.social?.visitors > 0) return 'company';
  if (sim.observer && sim.environment === 'playground' && Math.hypot(sim.observer.x - sim.x, sim.observer.y - sim.y, sim.observer.z - sim.z) < 7) return 'presence';
  return DIALOGUE[sim.environment] ? sim.environment : 'wandering';
}

export class FlyDialogue {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  reset() { this.elapsed = 0; this.next = 6; this.nextViewer = 100 + this.random() * 80; this.current = null; this.recent = []; this.bags = {}; this.lastContext = null; }
  pick(context) {
    if (!this.bags[context]?.length) {
      this.bags[context] = [...DIALOGUE[context]].filter(text => !this.recent.includes(text));
      for (let i = this.bags[context].length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bags[context][i], this.bags[context][j]] = [this.bags[context][j], this.bags[context][i]];
      }
    }
    const text = this.bags[context].pop() ?? DIALOGUE[context][0];
    this.recent.push(text); this.recent = this.recent.slice(-4); return text;
  }
  update(dt, sim, { running = true, canAddress = false } = {}) {
    if (!running) return null;
    this.elapsed += Math.max(0, Math.min(dt, .1));
    if (this.current && this.elapsed >= this.current.until) this.current = null;
    if (sim.state === 'Sleeping') { this.current = null; return null; }
    const context = dialogueContext(sim);
    if (context !== this.lastContext) { this.lastContext = context; this.next = Math.min(this.next, this.elapsed + 3); }
    if (this.current || this.elapsed < this.next) return null;
    const direct = canAddress && this.elapsed >= this.nextViewer;
    const pool = direct ? (sim.observer && sim.environment === 'playground' ? 'inPerson' : 'viewer') : this.random() < .72 ? context : ['wandering', 'plans', 'memories'][Math.floor(this.random() * 3)];
    const text = this.pick(pool), duration = Math.max(6, Math.min(11, text.length / 13));
    const entry = { text, kind: direct ? 'To you' : pool === 'memories' ? 'Remembering' : pool === 'plans' || pool === 'heading' ? 'Making plans' : 'Thinking aloud', room: sim.environment, state: sim.state, worldTime: sim.time, at: new Date().toISOString(), direct, duration };
    this.current = { ...entry, until: this.elapsed + duration + (direct ? 4.5 : 0) };
    this.next = this.current.until + 12 + this.random() * 18;
    if (direct) this.nextViewer = this.elapsed + 180 + this.random() * 180;
    return entry;
  }
}
