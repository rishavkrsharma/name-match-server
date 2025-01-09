import levenshtein from "fast-levenshtein";
import stringSimilarity from "string-similarity";
import { doubleMetaphone } from "double-metaphone";
import { getEmbedding } from "../service/openai.js";

function calculateCosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, v1, idx) => sum + v1 * vec2[idx], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, v) => sum + v ** 2, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, v) => sum + v ** 2, 0));
  return dotProduct / (magnitude1 * magnitude2);
}

export async function calculateNameSimilarity(name1, name2) {
    const normalize = (name) => name.toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
    const name1Norm = normalize(name1);
    const name2Norm = normalize(name2);

    const name1Parts = name1Norm.split(' ');
    const name2Parts = name2Norm.split(' ');

    const allCombinations = (arr1, arr2) => {
        let maxLevScore = 0;
        let maxStringSimScore = 0;
        arr1.forEach((part1) => {
            arr2.forEach((part2) => {
                const levDistance = levenshtein.get(part1, part2);
                const levScore = 1 - levDistance / Math.max(part1.length, part2.length);
                const stringSimScore = stringSimilarity.compareTwoStrings(part1, part2);

                maxLevScore = Math.max(maxLevScore, levScore);
                maxStringSimScore = Math.max(maxStringSimScore, stringSimScore);
            });
        });
        return { maxLevScore, maxStringSimScore };
    };

    const { maxLevScore, maxStringSimScore } = allCombinations(name1Parts, name2Parts);

    const phoneticMatches = name1Parts.map((part1) => {
        return name2Parts.some((part2) => {
            const [phonetic1A, phonetic1B] = doubleMetaphone(part1);
            const [phonetic2A, phonetic2B] = doubleMetaphone(part2);
            return phonetic1A === phonetic2A || phonetic1B === phonetic2B;
        });
    });

    const embeddingRes = await Promise.all([
        getEmbedding(name1),
        getEmbedding(name2),
      ]);
      const embedding1 = embeddingRes[0];
      const embedding2 = embeddingRes[1];
      const embeddingSimScore = calculateCosineSimilarity(embedding1, embedding2);

    const phoneticMatchScore = phoneticMatches.includes(true) ? 1 : 0;

    const finalScore = (
        maxLevScore  * 0.25 +
        maxStringSimScore * 0.25 +
        phoneticMatchScore * 0.2 +
        embeddingSimScore * 0.3
      ).toFixed(2);

      
      return {
        levScore: maxLevScore,
        stringSimScore: maxStringSimScore,
        phoneticMatchScore,
        embeddingSimScore,
        finalScore,
      };
}

