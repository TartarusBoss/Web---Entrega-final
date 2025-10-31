const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uksjnuhextannefgecja.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2pudWhleHRhbm5lZmdlY2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTk5MjUsImV4cCI6MjA3NzMzNTkyNX0.5JgHDtvz4GTxHeVmQleji1pVs2d963iA-jo58MOmYSs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// If a SERVICE ROLE key is provided via env, use it for uploads (bypass RLS for scripting).
// WARNING: never commit the service role key to source control. Use local env only.
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const uploadClient = SUPABASE_SERVICE_ROLE
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  : supabase;
const postersDir = path.join(__dirname, 'posters');
const bucketName = 'bucket';

// Mapea por título (legacy) o por id usando mapping.json. Si quieres emparejar por id crea
// el archivo scripts/posters/mapping.json con contenido tipo:
// { "<movie-id>": "archivo.jpg", "<otra-id>": "otro.jpg" }
const mapping = {
  'John Wick': 'john_wick.jpg',
  'Mad Max: Fury Road': 'mad_max_fury_road.jpg',
  'Superbad': 'superbad.jpg',
  'The Hangover': 'the_hangover.jpg',
  'The Pursuit of Happyness': 'the_pursuit_of_happyness.jpg',
  'Whiplash': 'whiplash.jpg',
  'Interstellar': 'interstellar.jpg',
  'Blade Runner 2049': 'blade_runner_2049.jpg',
  'Get Out': 'get_out.jpg',
  'Hereditary': 'hereditary.jpg'
};
const idMappingPath = path.join(postersDir, 'mapping.json');
let idMapping = null;
if (fs.existsSync(idMappingPath)) {
  try {
    idMapping = JSON.parse(fs.readFileSync(idMappingPath, 'utf8'));
    console.log('Usando mapping por ID desde scripts/posters/mapping.json');
  } catch (e) {
    console.warn('No se pudo leer mapping.json — se usará mapping por título');
    idMapping = null;
  }
}

async function uploadAndUpdate() {
  // Si no se usa service role, pero se proporcionan credenciales de usuario, iniciar sesión
  const SUPABASE_EMAIL = process.env.SUPABASE_EMAIL;
  const SUPABASE_PASSWORD = process.env.SUPABASE_PASSWORD;
  if (!SUPABASE_SERVICE_ROLE && SUPABASE_EMAIL && SUPABASE_PASSWORD) {
    console.log('Iniciando sesión con usuario proporcionado...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: SUPABASE_EMAIL,
      password: SUPABASE_PASSWORD
    }).catch(e => ({ error: e }));
    if (authErr) {
      console.warn('No se pudo iniciar sesión con las credenciales proporcionadas:', authErr.message || authErr);
    } else {
      console.log('Sesión iniciada correctamente.');
    }
  }
  if (!fs.existsSync(postersDir)) {
    console.error('No existe la carpeta scripts/posters/. Crea la carpeta y coloca ahí los archivos con los nombres indicados.');
    process.exit(1);
  }

  // Si idMapping está presente subimos según movieId -> filename
  if (idMapping) {
    for (const [movieId, filename] of Object.entries(idMapping)) {
      const filePath = path.join(postersDir, filename);
      if (!fs.existsSync(filePath)) {
        console.warn(`Archivo no encontrado para id "${movieId}": ${filename} — saltando.`);
        continue;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const destName = `${Date.now()}-${filename}`;

      console.log(`Subiendo ${filename} para movieId "${movieId}" como ${destName}...`);
      const { data: uploadData, error: uploadErr } = await uploadClient.storage
        .from(bucketName)
        .upload(destName, fileBuffer, { contentType: getContentType(filename) });

      if (uploadErr) {
        console.error('Error subiendo archivo:', uploadErr.message || uploadErr);
        continue;
      }

      const { data: urlData } = uploadClient.storage.from(bucketName).getPublicUrl(destName);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        console.error('No se obtuvo publicUrl para', destName);
        continue;
      }

      // Actualizar la fila movies por id
      const { error: updErr } = await uploadClient
        .from('movies')
        .update({ poster_url: publicUrl })
        .eq('id', movieId);

      if (updErr) {
        console.error('Error actualizando poster_url en la película id', movieId, updErr.message || updErr);
        continue;
      }

      console.log(`OK: ${movieId} -> ${publicUrl}`);
    }
    console.log('Proceso terminado (mapping por id).');
    return;
  }

  for (const [title, filename] of Object.entries(mapping)) {
    const filePath = path.join(postersDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`Archivo no encontrado para "${title}": ${filename} — saltando.`);
      continue;
    }

    // Leer el archivo en memoria como Buffer (evita problemas de "duplex" en algunas versiones de Node)
    const fileBuffer = fs.readFileSync(filePath);
    const destName = `${Date.now()}-${filename}`;

    console.log(`Subiendo ${filename} para película "${title}" como ${destName}...`);
    const { data: uploadData, error: uploadErr } = await uploadClient.storage
      .from(bucketName)
      .upload(destName, fileBuffer, { contentType: getContentType(filename) });

    if (uploadErr) {
      console.error('Error subiendo archivo:', uploadErr.message || uploadErr);
      continue;
    }

  const { data: urlData } = uploadClient.storage.from(bucketName).getPublicUrl(destName);
    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      console.error('No se obtuvo publicUrl para', destName);
      continue;
    }

    // Actualizar la fila movies por título
    const { data: movieData, error: movieErr } = await uploadClient
      .from('movies')
      .select('id')
      .eq('title', title)
      .limit(1);

    if (movieErr || !movieData || !movieData[0]) {
      console.error('No se encontró la película en la tabla movies para título:', title, movieErr && movieErr.message);
      continue;
    }

    const movieId = movieData[0].id;
    const { error: updErr } = await uploadClient
      .from('movies')
      .update({ poster_url: publicUrl })
      .eq('id', movieId);

    if (updErr) {
      console.error('Error actualizando poster_url en la película', title, updErr.message || updErr);
      continue;
    }

    console.log(`OK: ${title} -> ${publicUrl}`);
  }

  console.log('Proceso terminado.');
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

uploadAndUpdate().catch(err => {
  console.error('Error en uploadAndUpdate:', err.message || err);
  process.exit(1);
});
