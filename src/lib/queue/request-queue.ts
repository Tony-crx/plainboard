import PQueue from 'p-queue';

// Konfigurasi ini menjamin kita hanya mengeksekusi 5 concurrency sekaligus
// Dan memastikan ada jarak antar hit ke API untuk mencegah 429 instan.
export const globalQueue = new PQueue({
    concurrency: 5, 
    intervalCap: 5, 
    interval: 1000  
});
