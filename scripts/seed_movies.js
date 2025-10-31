const { createClient } = require('@supabase/supabase-js');

// Lee variables de entorno o usa el valor que ya proporcionaste
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uksjnuhextannefgecja.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2pudWhleHRhbm5lZmdlY2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTk5MjUsImV4cCI6MjA3NzMzNTkyNX0.5JgHDtvz4GTxHeVmQleji1pVs2d963iA-jo58MOmYSs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('Iniciando seed en Supabase:', SUPABASE_URL);

  // Categorías
  const categories = [
    'Acción','Thriller','Comedia','Adolescente','Drama','Biografía','Música','Ciencia ficción','Aventura','Neo-noir','Terror','Suspenso','Misterio'
  ];

  for (const name of categories) {
    const { data, error } = await supabase.from('categories').upsert({ name }).limit(1);
    if (error) console.error('Error insert category', name, error.message);
  }

  // Películas a insertar
  const movies = [
    {
      title: 'John Wick',
      description: 'Un exasesino busca venganza tras el asesinato de su perro, el último regalo de su difunta esposa.',
      release_date: '2014-01-01',
      categories: ['Acción','Thriller'],
      director: 'Chad Stahelski',
      duration: '1h 41min'
    },
    {
      title: 'Mad Max: Fury Road',
      description: 'En un mundo postapocalíptico, Max y Furiosa luchan por la libertad en medio del desierto y la locura.',
      release_date: '2015-01-01',
      categories: ['Acción','Ciencia ficción','Aventura'],
      director: 'George Miller',
      duration: '2h'
    },
    {
      title: 'Superbad',
      description: 'Dos adolescentes intentan disfrutar su última fiesta antes de graduarse, con resultados caóticos y divertidos.',
      release_date: '2007-01-01',
      categories: ['Comedia','Adolescente'],
      director: 'Greg Mottola',
      duration: '1h 53min'
    },
    {
      title: 'The Hangover',
      description: 'Un grupo de amigos se despierta en Las Vegas sin recordar nada de la noche anterior, y deben encontrar al novio desaparecido.',
      release_date: '2009-01-01',
      categories: ['Comedia'],
      director: 'Todd Phillips',
      duration: '1h 40min'
    },
    {
      title: 'The Pursuit of Happyness',
      description: 'Basada en una historia real, un padre lucha contra la pobreza mientras intenta darle un futuro mejor a su hijo.',
      release_date: '2006-01-01',
      categories: ['Drama','Biografía'],
      director: 'Gabriele Muccino',
      duration: '1h 57min'
    },
    {
      title: 'Whiplash',
      description: 'Un joven baterista se enfrenta a un maestro implacable en su búsqueda de la perfección musical.',
      release_date: '2014-01-01',
      categories: ['Drama','Música'],
      director: 'Damien Chazelle',
      duration: '1h 47min'
    },
    {
      title: 'Interstellar',
      description: 'Un grupo de astronautas viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad.',
      release_date: '2014-01-01',
      categories: ['Ciencia ficción','Aventura','Drama'],
      director: 'Christopher Nolan',
      duration: '2h 49min'
    },
    {
      title: 'Blade Runner 2049',
      description: 'Un replicante descubre un secreto que podría cambiar el destino de la humanidad y de su propia especie.',
      release_date: '2017-01-01',
      categories: ['Ciencia ficción','Neo-noir'],
      director: 'Denis Villeneuve',
      duration: '2h 44min'
    },
    {
      title: 'Get Out',
      description: 'Un joven afroamericano visita a los padres de su novia, pero pronto descubre una aterradora conspiración.',
      release_date: '2017-01-01',
      categories: ['Terror','Suspenso','Misterio'],
      director: 'Jordan Peele',
      duration: '1h 44min'
    },
    {
      title: 'Hereditary',
      description: 'Tras la muerte de su madre, una familia comienza a experimentar sucesos paranormales cada vez más perturbadores.',
      release_date: '2018-01-01',
      categories: ['Terror','Drama'],
      director: 'Ari Aster',
      duration: '2h 7min'
    }
  ];

  // Inserta películas una por una y crea relaciones con categorías
  for (const m of movies) {
    // poster placeholder (puedes reemplazar por URL real o subir archivo)
    const posterUrl = `https://via.placeholder.com/300x450?text=${encodeURIComponent(m.title)}`;

    const { data: inserted, error: insertErr } = await supabase.from('movies').insert([{
      title: m.title,
      description: m.description,
      poster_url: posterUrl,
      release_date: m.release_date,
      director: m.director,
      duration: m.duration
    }]).select().single();

    if (insertErr) {
      console.error('Error insert movie', m.title, insertErr.message);
      continue;
    }

    // Obtener ids de categorías
    for (const catName of m.categories) {
      const { data: catData, error: catErr } = await supabase.from('categories').select('id').eq('name', catName).limit(1);
      if (catErr || !catData || !catData[0]) {
        console.warn('Categoría no encontrada:', catName);
        continue;
      }
      const categoryId = catData[0].id;
      const { error: relErr } = await supabase.from('movie_categories').insert([{ movie_id: inserted.id, category_id: categoryId }]);
      if (relErr) console.error('Error creating movie_category', relErr.message);
    }

    console.log('Insertada película:', m.title);
  }

  console.log('Seed finalizado.');
}

seed().catch(err => {
  console.error('Seed error', err.message || err);
  process.exit(1);
});
