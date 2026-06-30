const CACHE_NAME="shopping-memo-v8"
self.addEventListener("install",event=>{
    event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>{
        return cache.addAll([
            "./",
            "./index.html",
            "./style.css",
            "./app.js",
            "./manifest.json",
            "./image/app-icon_192px.png",
            "./image/app-icon_512px.png"
        ])
    })
    )
})