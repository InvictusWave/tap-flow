import { db } from './lib/db';
import { customTemplates } from './lib/schema';
import { TEMPLATE_PRESETS } from './lib/template-presets';

async function seed() {
  const now = Math.floor(Date.now() / 1000);
  for (const preset of TEMPLATE_PRESETS) {
    try {
      await db.insert(customTemplates).values({
        id: preset.id,
        name: preset.name,
        aspect: preset.aspect,
        width: preset.width,
        height: preset.height,
        background: preset.background,
        elements: JSON.stringify(preset.elements),
        thumbnail: preset.thumbnail || null,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Inserted ${preset.id}`);
    } catch {
      console.log(`Skipped ${preset.id} (might exist)`);
    }
  }
  console.log('Done');
}

seed();
