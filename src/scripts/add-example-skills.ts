import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const beginnerSkills = [
  { name: "Blow Bubbles", description: "Blow bubbles in the water for 3 seconds" },
  { name: "Float on Back", description: "Float on back with minimal assistance" },
  { name: "Float on Front", description: "Float on front with minimal assistance" },
  { name: "Kick with Support", description: "Kick legs while holding the wall or with support" },
  { name: "Submerge Head", description: "Fully submerge head underwater for 3 seconds" },
];

const intermediateSkills = [
  { name: "Front Crawl", description: "Swim front crawl for 15 meters" },
  { name: "Back Stroke", description: "Swim backstroke for 15 meters" },
  { name: "Treading Water", description: "Tread water for 30 seconds" },
  { name: "Deep Water Jump", description: "Jump into deep water and return to surface" },
  { name: "Retrieve Object", description: "Retrieve object from pool bottom in chest-deep water" },
];

const advancedSkills = [
  { name: "Butterfly", description: "Swim butterfly stroke for 25 meters" },
  { name: "Breaststroke", description: "Swim breaststroke for 25 meters" },
  { name: "Flip Turn", description: "Perform a flip turn at the wall" },
  { name: "Surface Dive", description: "Perform a surface dive to pool bottom" },
  { name: "Continuous Swim", description: "Swim continuously for 200 meters" },
];

async function addSkills() {
  try {
    // Get all class levels
    const classLevels = await prisma.classLevel.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });

    console.log(`Found ${classLevels.length} class levels`);

    for (const classLevel of classLevels) {
      // Determine which skills to add based on the class level name
      let skillsToAdd = beginnerSkills;
      if (classLevel.name.toLowerCase().includes('intermediate')) {
        skillsToAdd = intermediateSkills;
      } else if (classLevel.name.toLowerCase().includes('advanced')) {
        skillsToAdd = advancedSkills;
      }

      // Check if skills already exist for this class level
      const existingSkills = await prisma.skill.count({
        where: { classLevelId: classLevel.id },
      });

      if (existingSkills === 0) {
        // Add skills for this class level
        await Promise.all(
          skillsToAdd.map(skill =>
            prisma.skill.create({
              data: {
                name: skill.name,
                description: skill.description,
                classLevelId: classLevel.id,
              },
            })
          )
        );
        console.log(`Added ${skillsToAdd.length} skills to ${classLevel.name}`);
      } else {
        console.log(`Skills already exist for ${classLevel.name}`);
      }
    }

    console.log('Skills added successfully');
  } catch (error) {
    console.error('Error adding skills:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSkills(); 