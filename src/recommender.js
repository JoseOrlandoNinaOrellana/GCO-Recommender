// Recommender

function loadDocuments(path)
{
    let fs = require('fs');

    // Abre el fichero
    let file = fs.readFileSync(path, "utf8");
    file = file.trim();

    // Splitea por saltos de línea
    let lines = file.split("\n");
    let matrix = [];

    // Eliminar signos de puntuación, dobles espacios, números
    for(let i = 0; i < lines.length; ++i)
    {
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

function loadStopWords(path)
{
    let fs = require('fs');

    // Abre el fichero
    let file = fs.readFileSync(path, "utf8");
    file = file.trim();

    // Splitea por saltos de línea
    let array = file.split("\n");

    return array;
}

function loadCorpus(path)
{
    let fs = require('fs');

    // Creamos el objeto hash con Parse()
    let hash = JSON.parse(fs.readFileSync(path));

    return hash;
}

function removeStopWords(matrix, stopWords)
{
    for(let i = 0; i < matrix.length; ++i)
        for(let j = 0; j < matrix[i].length; ++j)
            if(stopWords.includes(matrix[i][j]))
            {
                matrix[i].splice(matrix[i].indexOf(matrix[i][j]), 1);
                --j;
            }
}

function lemmatization(matrix, corpus)
{
    for(let i = 0; i < matrix.length; ++i)
        for(let j = 0; j < matrix[i].length; ++j)
            if(corpus.hasOwnProperty(matrix[i][j]))
                matrix[i][j] = corpus[matrix[i][j]]
}

function getAllWords(matrix)
{
    let allWords = matrix.reduce(function(prev, next) {
        return prev.concat(next);
    });

    allWords = allWords.filter((v, i, a) => a.indexOf(v) === i);

    return allWords;
}

function numTimesWordAppears(documents, word)
{
    let numTimes = 0;

    for(let i = 0; i < documents.length; ++i)
        if(documents[i].includes(word))
            numTimes++;
    
    return numTimes;
}

function createTable(documents, words)
{
    let table = [];

    for(let i = 0; i < documents.length; ++i)
        table.push([]);

    for(let i = 0; i < documents.length; ++i)
        for(let j = 0; j < words.length; ++j)
            table[i].push([words[j], 0, 0, 0])
    
    // Calcular TF
    for(let i = 0; i < table.length; ++i)
        for(let j = 0; j < table[i].length; ++j)
        {
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

    for(let i = 0; i < table.length; ++i)
    {    
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

function showTable(table)
{
    for(let i = 0; i < table.length; ++i)
    {
        process.stdout.write("\n" + "Document" + (i + 1) + "\t\tTF\t\tIDF\t\tTF-IDF\n");
        for(let j = 0; j < table[i].length; ++j)
        {
            if(table[i][j][1] > 0)
            {
                for(let k = 0; k < table[i][j].length; ++k)
                {
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

function calculateSim(table)
{
    let sim = [];

    for(let i = 0; i < table.length; ++i)
        sim.push(new Array(table.length).fill(0));

    for(let a = 0; a < sim.length; ++a)
    {
        for(let b = 0; b < sim[a].length; ++b)
        {
            let sum = 0;

            for(let k = 0; k < table[a].length; ++k)
                sum += table[a][k][3] * table[b][k][3];

            sim[a][b] = sum;
        }
    }

    return sim;
}

function showSim(sim)
{
    process.stdout.write("\nMatriz de similitud\n")
    for(let i = 0; i < sim.length; ++i)
    {
        for(let j = 0; j < sim[i].length; ++j)
            process.stdout.write(sim[i][j].toFixed(4) + "\t");
        process.stdout.write("\n");
    }
}

function main()
{
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

main();