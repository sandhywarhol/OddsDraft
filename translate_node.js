const fs = require('fs');
const translate = require('translate-google');

async function translateDict(d) {
    if (typeof d === 'string') {
        try {
            return await translate(d, {from: 'id', to: 'en'});
        } catch (e) {
            console.error(`Error translating: ${e}`);
            return d;
        }
    } else if (Array.isArray(d)) {
        return Promise.all(d.map(item => translateDict(item)));
    } else if (typeof d === 'object' && d !== null) {
        const newD = {};
        for (const [k, v] of Object.entries(d)) {
            newD[k] = await translateDict(v);
        }
        return newD;
    }
    return d;
}

async function main() {
    console.log("Loading JSON...");
    const rawData = fs.readFileSync('src/lib/commentaryKnowledge.json', 'utf-8');
    const data = JSON.parse(rawData);
    
    console.log("Translating...");
    const translatedData = {};
    const countries = Object.keys(data);
    
    // Process sequentially to avoid rate limits
    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        console.log(`Translating ${country} (${i+1}/${countries.length})...`);
        
        translatedData[country] = {};
        const categories = Object.keys(data[country]);
        
        for (const category of categories) {
            translatedData[country][category] = [];
            const facts = data[country][category];
            
            // Chunked translation for speed
            try {
                // translate-google can take an array!
                const res = await translate(facts, {from: 'id', to: 'en'});
                translatedData[country][category] = res;
            } catch (err) {
                console.error(`Error translating ${country} -> ${category}: ${err}`);
                // fallback sequential
                for (const fact of facts) {
                    try {
                        const r = await translate(fact, {from: 'id', to: 'en'});
                        translatedData[country][category].push(r);
                    } catch (e) {
                        translatedData[country][category].push(fact);
                    }
                }
            }
        }
    }
    
    fs.writeFileSync('src/lib/commentaryKnowledge.json', JSON.stringify(translatedData, null, 2));
    console.log("Translation complete! Saved to commentaryKnowledge.json");
}

main();
