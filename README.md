# Sistemas de recomendación. Modelos basados en el contenido

## Autores
* Sandro Jesús Socas Méndez  | alu0101208770@ull.edu.es
* José Orlando Nina Orellana | alu0101322308@ull.edu.es
* Álvaro Rodríguez Gómez     | alu0101362953@ull.edu.es

## Ejemplo de uso

```Bash
node src/recommender.js ./examples-documents/documents-01.txt ./stop-words/stop-words-en.txt ./corpus/corpus-en.txt > output.txt
```

## Código
El esquema principal de la aplicación es el siguiente. Empezamos cargando los 
datos a partir de los documentos, las palabras de parada y el corpus, eliminamos
las palabras vacias y lematizamos el corpus. Con esto calculado obtenemos todas
las palabras de todos los ficheros, para luego mostrar la tabla con la frecuencia
de los terminos, la frecuencia inversa calculada y la similitud entre términos.
Por ultimo se muestra la matriz de similitud. Procederemos a analizar cada
función aquí utilizada en los siguientes apartados.
```Javascript
function main(){
  // Cargamos ficheros
  let documents = loadDocuments(process.argv[2]);
  let stopWords = loadStopWords(process.argv[3]);
  let corpus = loadCorpus(process.argv[4]);
  // Eliminar palabras vacías
  removeStopWords(documents, stopWords);
  // Lematización
  lemmatization(documents, corpus);
  // Cogemos de todas las palabaras que aparecen en los documentos
  let allWords = getAllWords(documents);
  // Creamos la tabla
  let table = createTable(documents, allWords);
  showTable(table, documents);
  // Creamos la matriz de similitud
  let sim = calculateSim(table);
  showSim(sim);
}
```

### loadDocuments
Abrimos el documento para separarlo por lineas, eliminamos informacion irrelevante como signos de puntuación, dobles espacios, números,... para
luego insertar las palabras de cada linea separandolas por espacios y cada
palabra pasarla a minuscula. Devuelve una matriz de palabras.

```Javascript
function loadDocuments(path){
  let fs = require('fs');
  // Abre el fichero
  let file = fs.readFileSync(path, "utf8");
  file = file.trim();
  // Splitea por saltos de línea
  let lines = file.split("\n");
  let matrix = [];
  // Eliminar signos de puntuación, dobles espacios, números
  for(let i = 0; i < lines.length; ++i){
    lines[i] = lines[i].replaceAll(".", "");
    lines[i] = lines[i].replaceAll(",", "");
    //lines[i] = lines[i].replaceAll(/[0-9]/g, "");
    lines[i] = lines[i].replaceAll(/ +(?= )/g, "");
  }
  // Splitea por espacios
  for(let i = 0; i < lines.length; ++i)
    matrix.push(lines[i].split(" "));
  // Pasamos todas las palabras a minúscula
  for(let i = 0; i < matrix.length; ++i)
    for(let j = 0; j < matrix[i].length; ++j)
      matrix[i][j] = matrix[i][j].toLowerCase();
  return matrix;
}
```
***
### loadStopWords
Abrimos el fichero de stopWords para cargarlas en un vector.

```Javascript
function loadStopWords(path){
  let fs = require('fs');
  // Abre el fichero
  let file = fs.readFileSync(path, "utf8");
  file = file.trim();
  // Splitea por saltos de línea
  let array = file.split("\n");
  return array;
}
```
***
### loadCorpus
Abrimos el fichero de corpus para crear un hash aprovechando la funcion
para parsear un JSON.

```Javascript
function loadCorpus(path){
  let fs = require('fs');
  // Creamos el objeto hash con Parse()
  let hash = JSON.parse(fs.readFileSync(path));
  return hash;
}
```
***
### removeStopWords
Recorremos la matriz de palabras y si la palabra es una palabra de parada,
eliminamos esa posicion del vector, es decir, la palabra.

```Javascript
function removeStopWords(matrix, stopWords){
  for(let i = 0; i < matrix.length; ++i)
    for(let j = 0; j < matrix[i].length; ++j)
      if(stopWords.includes(matrix[i][j])){
        matrix[i].splice(matrix[i].indexOf(matrix[i][j]), 1);
        --j;
      }
}
```
***
### lemmatization
Recorremos la matriz de palabras y sustituimos las palabras por sus
raices que aparecen en el corpus.

```Javascript
function lemmatization(matrix, corpus){
  for(let i = 0; i < matrix.length; ++i)
    for(let j = 0; j < matrix[i].length; ++j)
      if(corpus.hasOwnProperty(matrix[i][j]))
        matrix[i][j] = corpus[matrix[i][j]]
}
```
***
### getAllWords
Reducimos la matriz a un vector conteniendo todas las palabras

```Javascript
function getAllWords(matrix){
  let allWords = matrix.reduce(function(prev, next) {
    return prev.concat(next);
  });

  allWords = allWords.filter((v, i, a) => a.indexOf(v) === i);

  return allWords;
}
```
***
### numTimesWordAppears
Recorremos todos los documentos contando las veces que aparece la palabra

```Javascript
function numTimesWordAppears(documents, word){
  let numTimes = 0;
  for(let i = 0; i < documents.length; ++i)
    if(documents[i].includes(word))
      numTimes++;
  return numTimes;
}
```
***
### createTable
Inicializamos la tabla tridimensional en la que representaremos, para cada documento,
para cada palabra en él, los datos de TD ,IDF y TF-IDF.
Para calcular TF, contamos las veces que aparece la palabra y aplicamos la formula.
Para calcular IDF, asignamos en la posicion del IDF el valor calculado según la expresion.
Para calcular TF-IDF, hacemos la suma de cuadrados de TF y calculamos la inversa.

```Javascript
function createTable(documents, words){
  let table = [];
  for(let i = 0; i < documents.length; ++i)
    table.push([]);
  for(let i = 0; i < documents.length; ++i)
    for(let j = 0; j < words.length; ++j)
      table[i].push([words[j], 0, 0, 0])
  // Calcular TF
  for(let i = 0; i < table.length; ++i)
    for(let j = 0; j < table[i].length; ++j){
      let n_times =  documents[i].filter((item) => (item === table[i][j][0])).length;
      if(n_times > 0)
        table[i][j][1] = 1 + Math.log10(n_times);
    }
  // Calcular IDF
  for(let i = 0; i < table.length; ++i)
    for(let j = 0; j < table[i].length; ++j)
      table[i][j][2] = Math.log10(documents.length / numTimesWordAppears(documents, table[i][j][0]))

  // Calcular TF-IDF
  let lengthVector = [];
  for(let i = 0; i < table.length; ++i){    
    let sum = 0;
    for(let j = 0; j < table[i].length; ++j)
      sum += Math.pow(table[i][j][1], 2); 
    lengthVector.push(sum);
  }
  for(let i = 0; i < table.length; ++i)
    for(let j = 0; j < table[i].length; ++j)
      table[i][j][3] = table[i][j][1] / lengthVector[i];   
  return table;
}
```
### showTable
Mostramos la tabla calculada anteriormente formateada con el nombre de columnas

```Javascript
function showTable(table){
  for(let i = 0; i < table.length; ++i){
    process.stdout.write("\n" + "Document" + (i + 1) + "\t\tTF\t\tIDF\t\tTF-IDF\n");
    for(let j = 0; j < table[i].length; ++j){
      if(table[i][j][1] > 0){
        for(let k = 0; k < table[i][j].length; ++k){
          if(typeof table[i][j][k] === "number")
            process.stdout.write(table[i][j][k].toFixed(4) + "\t");
          else if(typeof table[i][j][k] === "string")
            if(table[i][j][k].length < 12)
              process.stdout.write(table[i][j][k] + " ".repeat(12 - table[i][j][k].length) + "\t");
            else
              process.stdout.write(table[i][j][k] + "\t");
          else
            process.stdout.write(table[i][j][k] + "\t");
        }
        process.stdout.write("\n");
      }
    }
  }
}
```
***
### calculateSim
Calculamos la matriz de similitud, empleando los datos creados en la tabla sobre
cada documento.

```Javascript
function calculateSim(table){
  let sim = [];
  for(let i = 0; i < table.length; ++i)
    sim.push(new Array(table.length).fill(0));
  for(let a = 0; a < sim.length; ++a){
    for(let b = 0; b < sim[a].length; ++b){
      let sum = 0;
      for(let k = 0; k < table[a].length; ++k)
        sum += table[a][k][3] * table[b][k][3];
        sim[a][b] = sum;
      }
  }
  return sim;
}
```
***
### showSim
Mostramos la matriz de similitud formateada.

```Javascript
function showSim(sim){
  process.stdout.write("\nMatriz de similitud\n")
  for(let i = 0; i < sim.length; ++i){
    for(let j = 0; j < sim[i].length; ++j)
      process.stdout.write(sim[i][j].toFixed(4) + "\t");
    process.stdout.write("\n");
  }
}
```
***
