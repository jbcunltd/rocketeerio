const z = require('zod');
const schema = z.object({ name: z.string() });
console.log('schema parse works:', !!schema.parse({ name: 'test' }));
console.log('schema safeParse works:', schema.safeParse({ name: 'test' }).success);
console.log('schema._def exists:', !!schema._def);
console.log('schema._def.typeName:', schema._def?.typeName);
