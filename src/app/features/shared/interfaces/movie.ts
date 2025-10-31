export interface Movie {
    id: string;
    title: string;
    description: string;
    posterUrl: string;
    releaseDate: Date;
    categories: string[];
    averageRating: number;
    createdAt: Date;
    createdBy: string;
    director: string | null;
    duration: number | null;
}