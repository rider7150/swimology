import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const swimLevels = [
  {
    name: "A / Water Discovery",
    description: "First stage of infant/toddler swim lessons",
    displayOrder: 1,
    skills: [
      { name: "Blow bubbles", description: "on surface, assisted" },
      { name: "Front tow", description: "chin in water, assisted" },
      { name: "Water exit", description: "parent & child together" },
      { name: "Water entry", description: "parent & child together" },
      { name: "Back float", description: "assisted, head on shoulder" },
      { name: "Roll", description: "assisted, back to front & front to back" },
      { name: "Front float", description: "chin in water, assisted" },
      { name: "Back tow", description: "assisted, head on shoulder" },
      { name: "Wall grab", description: "assisted" }
    ]
  },
  {
    name: "B / Water Exploration",
    description: "Second stage of infant/toddler swim lessons",
    displayOrder: 2,
    skills: [
      { name: "Blow bubbles", description: "mouth & nose submerged, assisted" },
      { name: "Front tow", description: "blow bubbles, assisted" },
      { name: "Water exit", description: "assisted" },
      { name: "Water entry", description: "assisted" },
      { name: "Back float", description: "assisted, head on chest" },
      { name: "Roll", description: "assisted, back to front & front to back" },
      { name: "Front float", description: "blow bubbles, assisted" },
      { name: "Back tow", description: "assisted, head on chest" },
      { name: "Monkey crawl", description: "assisted, on edge, 5 ft." }
    ]
  },
  {
    name: "1 / Water Acclimation",
    description: "First stage of preschool and school age swim lessons",
    displayOrder: 3,
    skills: [
      { name: "Submerge", description: "bob independently" },
      { name: "Front glide", description: "assisted, to wall, 5 ft." },
      { name: "Water exit", description: "independently" },
      { name: "Jump, push, turn, grab", description: "assisted" },
      { name: "Back float", description: "assisted, 10 secs., recover independently" },
      { name: "Roll", description: "assisted, back to front & front to back" },
      { name: "Front float", description: "assisted, 10 secs., recover independently" },
      { name: "Back glide", description: "assisted, at wall, 5 ft." },
      { name: "Swim, float, swim", description: "assisted, 10 ft." }
    ]
  },
  {
    name: "2 / Water Movement",
    description: "Second stage of preschool and school age swim lessons",
    displayOrder: 4,
    skills: [
      { name: "Submerge", description: "look at object on bottom" },
      { name: "Front glide", description: "10 ft. (5 ft. preschool)" },
      { name: "Water exit", description: "independently" },
      { name: "Jump, push, turn, grab", description: "" },
      { name: "Back float", description: "20 secs. (10 secs. preschool)" },
      { name: "Roll", description: "back to front & front to back" },
      { name: "Front float", description: "20 secs. (10 secs. preschool)" },
      { name: "Back glide", description: "10 ft. (5 ft. preschool)" },
      { name: "Tread water", description: "10 secs., near wall, & exit" },
      { name: "Swim, float, swim", description: "5 yd." }
    ]
  },
  {
    name: "3 / Water Stamina",
    description: "Third stage of preschool and school age swim lessons",
    displayOrder: 5,
    skills: [
      { name: "Submerge", description: "retrieve object in chest-deep water" },
      { name: "Swim on front", description: "15 yd. (10 yd. preschool)" },
      { name: "Water exit", description: "independently" },
      { name: "Jump, swim, turn, swim, grab", description: "10 yd." },
      { name: "Swim on back", description: "15 yd. (10 yd. preschool)" },
      { name: "Roll", description: "back to front & front to back" },
      { name: "Tread water", description: "1 min. & exit (30 secs. preschool)" },
      { name: "Swim, float, swim", description: "25 yd. (15 yd. preschool)" }
    ]
  },
  {
    name: "4 / Stroke Introduction",
    description: "Fourth stage of school age swim lessons",
    displayOrder: 6,
    skills: [
      { name: "Endurance", description: "any stroke or combination of strokes, 25 yd." },
      { name: "Front crawl", description: "rotary breathing, 15 yd." },
      { name: "Back crawl", description: "15 yd." },
      { name: "Dive", description: "sitting" },
      { name: "Resting stroke", description: "elementary backstroke, 15 yd." },
      { name: "Tread water", description: "scissor & whip kick, 1 min." },
      { name: "Breaststroke", description: "kick, 15 yd." },
      { name: "Butterfly", description: "kick, 15 yd." }
    ]
  },
  {
    name: "5 / Stroke Development",
    description: "Fifth stage of school age swim lessons",
    displayOrder: 7,
    skills: [
      { name: "Endurance", description: "any stroke or combination of strokes, 50 yd." },
      { name: "Front crawl", description: "bent-arm recovery, 25 yd." },
      { name: "Back crawl", description: "pull, 25 yd." },
      { name: "Dive", description: "kneeling" },
      { name: "Resting stroke", description: "sidestroke, 25 yd." },
      { name: "Tread water", description: "scissor & whip kick, 2 mins." },
      { name: "Breaststroke", description: "25 yd." },
      { name: "Butterfly", description: "simultaneous arm action & kick, 15 yd." }
    ]
  },
  {
    name: "6 / Stroke Mechanics",
    description: "Sixth stage of school age swim lessons",
    displayOrder: 8,
    skills: [
      { name: "Endurance", description: "any stroke or combination of strokes, 150 yd." },
      { name: "Front crawl", description: "flip turn, 50 yd." },
      { name: "Back crawl", description: "pull & flip turn, 50 yd." },
      { name: "Dive", description: "standing" },
      { name: "Resting stroke", description: "elementary backstroke or sidestroke, 50 yd." },
      { name: "Tread water", description: "retrieve object off bottom, tread 1 min." },
      { name: "Breaststroke", description: "open turn, 50 yd." },
      { name: "Butterfly", description: "25 yd." }
    ]
  }
];

async function main() {
  console.log('Starting to seed swim levels and skills...');

  // Get the first organization (you might want to modify this based on your needs)
  const organization = await prisma.organization.findFirst();
  
  if (!organization) {
    throw new Error('No organization found. Please create an organization first.');
  }

  for (const level of swimLevels) {
    console.log(`Creating level: ${level.name}`);
    
    const classLevel = await prisma.classLevel.create({
      data: {
        name: level.name,
        description: level.description,
        organizationId: organization.id,
        capacity: 8,
        displayOrder: level.displayOrder
      }
    });

    for (const skill of level.skills) {
      console.log(`  Creating skill: ${skill.name}`);
      await prisma.skill.create({
        data: {
          name: skill.name,
          description: skill.description,
          classLevelId: classLevel.id
        }
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error while seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 