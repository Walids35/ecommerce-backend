import { Request, Response, NextFunction } from 'express';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Extend Express Request type to include language
declare global {
  namespace Express {
    interface Request {
      language: SupportedLanguage;
    }
  }
}

/**
 * Language detection middleware
 * Parses Accept-Language header and sets request.language
 * Falls back to DEFAULT_LANGUAGE (English) if no valid language found
 *
 * Accept-Language header format: "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7,ar;q=0.6"
 *
 * @example
 * // Usage in Express app:
 * app.use(detectLanguage);
 */
export const detectLanguage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get Accept-Language header
    const acceptLanguage = req.headers['accept-language'];

    // If no Accept-Language header, use default
    if (!acceptLanguage) {
      req.language = DEFAULT_LANGUAGE;
      return next();
    }

    // Parse Accept-Language header
    // Format: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6"
    // Split by comma to get individual language entries
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const parts = lang.trim().split(';');
        const code = parts[0]; // Language code (e.g., "fr-FR" or "fr")
        const qValue = parts[1]; // Quality value (e.g., "q=0.9")

        // Parse quality value (default is 1.0 if not specified)
        const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;

        // Extract primary language code (fr-FR -> fr)
        const primaryCode = code.split('-')[0].toLowerCase();

        return { code: primaryCode, quality };
      })
      // Sort by quality descending (highest quality first)
      .sort((a, b) => b.quality - a.quality);

    // Find first supported language
    const selectedLanguage = languages.find((lang) =>
      SUPPORTED_LANGUAGES.includes(lang.code as SupportedLanguage)
    );

    // Set language (use found language or default)
    req.language = selectedLanguage
      ? (selectedLanguage.code as SupportedLanguage)
      : DEFAULT_LANGUAGE;

    next();
  } catch (error) {
    // On any parsing error, fallback to default language
    console.error('Error parsing Accept-Language header:', error);
    req.language = DEFAULT_LANGUAGE;
    next();
  }
};
