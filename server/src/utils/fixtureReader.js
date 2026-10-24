const fs = require('fs');
const path = require('path');

/**
 * Safely reads a local fixture file using Node.js streams and buffers.
 * Enforces directory confinement to prevent path traversal.
 */
class FixtureReader {
  /**
   * Reads a fixture file into a UTF-8 string using streams and buffers.
   * @param {string} relativeOrAbsolutePath - Path to fixture
   * @param {string} [baseDir] - Allowed base directory (defaults to server/src/feeds)
   * @returns {Promise<{ content: string, byteLength: number, filename: string }>}
   */
  static readStreamAsync(relativeOrAbsolutePath, baseDir = path.resolve(__dirname, '../feeds')) {
    return new Promise((resolve, reject) => {
      // Resolve and normalize target path
      const resolvedPath = path.isAbsolute(relativeOrAbsolutePath)
        ? path.normalize(relativeOrAbsolutePath)
        : path.resolve(baseDir, relativeOrAbsolutePath);

      // Verify path stays within base directory or test directory
      const normalizedBase = path.normalize(baseDir);
      const testDir = path.resolve(__dirname, '../../tests');
      const isAllowed = resolvedPath.startsWith(normalizedBase) || resolvedPath.startsWith(testDir);

      if (!isAllowed) {
        return reject(new Error(`Security Error: Access to path "${resolvedPath}" is restricted outside allowed fixture directories.`));
      }

      if (!fs.existsSync(resolvedPath)) {
        return reject(new Error(`Fixture file not found at: ${resolvedPath}`));
      }

      const chunks = [];
      const readStream = fs.createReadStream(resolvedPath);

      readStream.on('data', (chunk) => {
        // Collect buffer chunks
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      readStream.on('end', () => {
        // Concatenate all buffer chunks into a single unified Buffer
        const combinedBuffer = Buffer.concat(chunks);
        resolve({
          content: combinedBuffer.toString('utf8'),
          byteLength: combinedBuffer.length,
          filename: path.basename(resolvedPath),
          filePath: resolvedPath
        });
      });

      readStream.on('error', (err) => {
        reject(new Error(`Stream reading error for fixture "${resolvedPath}": ${err.message}`));
      });
    });
  }
}

module.exports = FixtureReader;
