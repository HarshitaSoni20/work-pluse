import { prisma } from "./lib/prisma";
import { hashPassword, comparePassword } from "./lib/hash";

async function test() {
  try {
    const email = `test_${Date.now()}@auth.com`;
    const password = "password123";

    console.log("--- REGISTRATION ---");
    const hashedPassword = await hashPassword(password);
    console.log("Password before save:", password);
    console.log("Hashed password before save:", hashedPassword);

    const user = await prisma.user.create({
      data: {
        name: "Test Auth User",
        email,
        password: hashedPassword,
        role: "EMPLOYEE",
      },
    });
    console.log("Saved User Password Hash:", user.password);

    console.log("--- FETCH FOR LOGIN ---");
    const fetched = await prisma.user.findUnique({
      where: { email },
    });
    if (!fetched) {
      console.log("User not found in DB!");
      return;
    }
    console.log("Fetched User Password Hash:", fetched.password);

    const isMatch = await comparePassword(password, fetched.password);
    console.log("Compare result:", isMatch);
    
    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
