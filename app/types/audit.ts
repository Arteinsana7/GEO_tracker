export interface Analisis {
    cited : boolean;
    citation_type : "primary" | "secondary" | "none";
    sentiment : "positive" | "neutral" | "negative" | "none";
    sentiment_reason : string | null;
    competitors_cited : string [];
    geo_opportunity : string;
}


export interface Result {
    query: string; 
    llm_response : string;
    analysis : Analisis;
}

export interface DonePayload {
    geoScore  : number; 
    citationRate : number;
    cited : number ; 
    total : number ;
    results : Result[];
}

export interface AuditConfig {
    brand : string;
    sector : string;
    competitors : string[];
    queries : string [];

}