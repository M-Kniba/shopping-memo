const CACHE_NAME="shopping-memo-v4"
self.addEventListener("install",event=>{
    event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>{
        return cache.addAll([
            "./",
            "./index.html",
            "./style.css",
            "./app.js",
            "./manifest.json"
        ])
    })
    )
})