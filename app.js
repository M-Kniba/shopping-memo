/* =========================
PWA
========================= */

if("serviceWorker" in navigator){
    navigator.serviceWorker.register("service-worker.js")
}

/**
 * null → 新規追加
 * 数字 → 編集中
 */
let editingPriceId = null
let priceSortMode = "unitPrice"
/* =========================
画面切替
========================= */

function show(id){
    document.querySelectorAll(".screen").forEach(screen=>screen.classList.remove("active"))
    document.getElementById(id).classList.add("active")
}

function goHome(){
    show("homeScreen")
}

function openAdd(){
    show("addScreen")
    renderFrequent()
}

function openList(){
    show("listScreen")
    renderShoppingList()
}

function openPriceHome(){
    show("priceHomeScreen")
    renderVegetableList()
}

function openPriceAdd(name=""){
    show("priceAddScreen")
    editingPriceId = null
    renderStoreOptions()
    resetPriceForm(name)
}

function openPriceDetail(name){
    show("priceDetailScreen")
    document.getElementById("detailTitle").textContent=name
    renderPriceHistory(name)
}

function openSettings(){
    show("settingsScreen")
}

function openStoreSettings(){
    show("storeSettingsScreen")
    renderStoreList()
}

/* =========================
入力初期化
========================= */
function resetPriceForm(name=""){
    const today = new Date().toISOString().split("T")[0]

    document.getElementById("priceName").value=name
    document.getElementById("priceDate").value=today

    document.getElementById("priceStore").value=""
    document.getElementById("otherStore").value=""
    document.getElementById("otherStore").style.display="none"

    document.getElementById("priceQuantity").value=""
    document.getElementById("priceTotal").value=""
    document.getElementById("priceType").value = "piece"
    changePriceType()
}

/* =========================
localStorage
========================= */

function loadData(key,defaultValue=[]){
    try{
        return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue))
    }catch{
        return defaultValue
    }
}

function saveData(key,data){
    localStorage.setItem(key, JSON.stringify(data))
}

/* =========================
バックアップ
========================= */

function createBackup(){
    const result = confirm( "バックアップを作成しますか？\n\n" + "現在のデータをJSONファイルとして保存します。")
    if(!result) return

    const backupData = {
        shoppingList: loadData("shoppingList"),
        frequentItems: loadData("frequentItems"),
        priceHistory: loadData("priceHistory"),
        stores: loadData("stores"),
        exportedAt: new Date().toISOString()
    }

    const blob = new Blob(
        [JSON.stringify(backupData,null,2)],
        {type:"application/json"}
    )

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    const now = new Date()
    const fileName = `shopping-memo-backup-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}.json`

    a.download = fileName
    a.click()

    URL.revokeObjectURL(url)

    localStorage.setItem( "lastBackupDate", new Date().toISOString())

    renderLastBackupDate()
    alert("バックアップを作成しました")
}

async function restoreBackup(event){
    const file = event.target.files[0]
    if(!file) return

    try{
        const text = await file.text()
        const data = JSON.parse(text)

        const shoppingCount = (data.shoppingList || []).length
        const frequentCount = (data.frequentItems || []).length
        const priceCount = (data.priceHistory || []).length
        const storeCount = (data.stores || []).length

        const result = confirm(
            `バックアップ内容\n\n` +
            `買い物メモ: ${shoppingCount}件\n` +
            `よく買うもの: ${frequentCount}件\n` +
            `価格履歴: ${priceCount}件\n` +
            `店舗: ${storeCount}件\n\n` +
            `復元しますか？`
        )

        if(!result){
            event.target.value=""
            return
        }

        saveData("shoppingList", data.shoppingList || [])
        saveData("frequentItems", data.frequentItems || [])
        saveData("priceHistory", data.priceHistory || [])
        saveData("stores", data.stores || [])

        alert("復元しました")
        renderFrequent()
        renderVegetableList()
    }catch{
        alert("バックアップファイルを読み込めませんでした")
    }
    event.target.value=""
}

function renderLastBackupDate(){
    const text = document.getElementById("lastBackupText")
    const date = localStorage.getItem("lastBackupDate")

    if(!date){
        text.textContent = "最終バックアップ: なし"
        return
    }

    text.textContent = "最終バックアップ: " + new Date(date).toLocaleString("ja-JP")
}

/* =========================
買い物メモ
========================= */
function addCustom(){
    const input=document.getElementById("itemInput")
    const name=input.value.trim().replace(/\s+/g," ")
    if(!name)return

    const added = addShoppingItem(name)
    if(added){
        renderShoppingList()
        alert("追加しました")
    }else{
        alert("既に追加されています")
    }
    input.value=""
}

function renderShoppingList(){
    const ul=document.getElementById("shoppingList")
    const items=loadData("shoppingList")
    ul.innerHTML=""
    if(items.length===0){
        ul.innerHTML="<li>買い物メモがありません</li>"
        return
    }

    items.forEach((item)=>{
        const li=document.createElement("li")
        li.textContent=item.name
        if(item.checked){
            li.classList.add("checked")
        }

        li.onclick=()=>{
            item.checked=!item.checked
            saveData("shoppingList", items)
            renderShoppingList()
        }
        ul.appendChild(li)
    })
}

function clearAll(){
    if(!confirm("削除しますか？")) return
    localStorage.removeItem("shoppingList")
    renderShoppingList()
}


/* よく買うもの */
function addFrequent(){
    const input=document.getElementById("frequentInput")
    const name=input.value.trim().replace(/\s+/g," ")
    if(!name)return

    const items=loadData("frequentItems")
    if(items.some(item=>item.name===name)){
        alert("既に登録されています")
        return
    }
    items.push({
        name:name
    })

    saveData("frequentItems", items)
    input.value=""
    renderFrequent()
}

function renderFrequent(){
    const area=document.getElementById("frequentItems")
    const items=loadData("frequentItems")
    area.innerHTML=""
    if(items.length===0){
        area.textContent="まだ登録がありません"
        return
    }

    items.forEach(item=>{
        const btn=document.createElement("button")
        btn.textContent=item.name
        btn.onclick=()=>{
            const added = addShoppingItem(item.name)
            if(added){
                renderShoppingList()
                alert("追加しました")
            }else{
                alert("既に追加されています")
            }
        }
    area.appendChild(btn)
    })
}

function addShoppingItem(name){
    const items=loadData("shoppingList")
    if(items.some(item=>item.name===name && !item.checked)){
        return false
    }
    items.push({
        name:name,
        checked:false
    })
    saveData("shoppingList", items)
    return true
}


/* =========================
価格メモ
========================= */

function addPriceHistory(){
    const name=document.getElementById("priceName").value.trim().replace(/\s+/g," ")
    const storeSelect=document.getElementById("priceStore").value
    const otherStore=document.getElementById("otherStore").value.trim().replace(/\s+/g," ")
    const store = storeSelect==="その他" ? otherStore : storeSelect
    const priceType = document.getElementById("priceType").value
    const quantity=Number(document.getElementById("priceQuantity").value)
    const total=Number(document.getElementById("priceTotal").value)
    const date=document.getElementById("priceDate").value

    if(!name || !store || !date){
        alert("入力してください")
        return
    }
    if(quantity <= 0 || total <= 0 || !Number.isInteger(quantity) || !Number.isInteger(total)){
        alert("数量と価格は1以上の整数を入力してください")
        return
    }

    let unitPrice
    if(priceType === "piece"){
        unitPrice = (total / quantity).toFixed(2)
    }else{
        unitPrice = (total / quantity * 100).toFixed(2)
    }
    const history=loadData("priceHistory")
    if(editingPriceId !== null){
        const index = history.findIndex(
            item => item.id === editingPriceId
        )
        if(index === -1){
            alert("データが見つかりません")
            return
        }
        history[index] = {
            id:editingPriceId,
            name:name,
            store:store,
            priceType: priceType,
            quantity:quantity,
            total:total,
            unitPrice:unitPrice,
            date:date
        }
        editingPriceId = null
    }else{
        history.push({
            id:Date.now(),
            name:name,
            store:store,
            priceType: priceType,
            quantity:quantity,
            total:total,
            unitPrice:unitPrice,
            date:date
        })
    }

    saveData("priceHistory", history)
    resetPriceForm()
    renderStoreOptions()

    alert("保存しました")
    renderVegetableList()
}

function renderVegetableList(){
    const area=document.getElementById("vegetableList")
    const history=loadData("priceHistory")
    const uniqueNames=[...new Set(history.map(h=>h.name))]
    area.innerHTML=""
    if(uniqueNames.length===0){
        area.textContent="まだ登録がありません"
        return
    }

    uniqueNames.forEach(name=>{
        /* 行全体 */
        const row=document.createElement("div")
        row.className="vegetableRow"

        /* 商品名 */
        const title=document.createElement("span")
        title.textContent=name

        /* 追加ボタン */
        const addBtn=document.createElement("button")
        addBtn.textContent="追加"
        addBtn.onclick=()=>{
            openPriceAdd(name)
        }

        /* 履歴ボタン */
        const historyBtn=document.createElement("button")
        historyBtn.textContent="履歴"
        historyBtn.onclick=()=>{
            openPriceDetail(name)
        }

        /* 追加 */
        row.appendChild(title)
        row.appendChild(addBtn)
        row.appendChild(historyBtn)
        area.appendChild(row)
    })
}

function renderPriceHistory(name){
    const ul=document.getElementById("priceHistoryList")
    let history=loadData("priceHistory").filter(item=>item.name===name)
    if(history.length===0){
        ul.innerHTML="<li>履歴がありません</li>"
        return
    }

    if(priceSortMode==="unitPrice"){
        history.sort((a,b)=> Number(a.unitPrice)-Number(b.unitPrice))
    }else if(priceSortMode==="store"){
        history.sort((a,b)=>{
            /* 店名比較 */
            const storeCompare = a.store.localeCompare(b.store,"ja")
            if(storeCompare!==0){
                return storeCompare
            }
            /* 同じ店なら日付順 */
            return b.date.localeCompare(a.date)
        })
    }

    ul.innerHTML=""
    history.forEach(item=>{
        const li=document.createElement("li")
        const quantityLabel = item.priceType === "weight" ? "g" : "個"
        const unitLabel = item.priceType === "weight" ? "100gあたり" : "1個あたり"
        li.innerHTML=`
            <div>${item.date}</div>
            <div>${item.store}</div>
            <div>${item.quantity}${quantityLabel} / ${item.total}円</div>
            <div><strong>${unitLabel} ${item.unitPrice}円</strong></div>
        `
        li.onclick=()=>{ openPriceEdit(item.id) }
        ul.appendChild(li)
    })
}

function openPriceEdit(id){
    const history=loadData("priceHistory")
    const item=history.find(h=>h.id===id)
    if(!item){
        alert("データが見つかりません")
        return
    }
    editingPriceId=id
    show("priceAddScreen")
    renderStoreOptions()

    const select=document.getElementById("priceStore")
    const other=document.getElementById("otherStore")
    const options = loadData("stores")

    if(options.includes(item.store)){
        select.value=item.store
        other.value=""
        other.style.display="none"
    }else{
        select.value="その他"
        toggleOtherStore()
        other.value=item.store
    }

    document.getElementById("priceName").value=item.name
    document.getElementById("priceQuantity").value=item.quantity
    document.getElementById("priceTotal").value=item.total
    document.getElementById("priceDate").value=item.date
    document.getElementById("priceType").value = item.priceType || "piece" 
    changePriceType()
}

function toggleOtherStore(){
    const select=document.getElementById("priceStore")
    const other=document.getElementById("otherStore")

    if(select.value==="その他"){
        other.style.display="block"
    }else{
        other.style.display="none"
    }
}

function changePriceSort(){
    priceSortMode = document.getElementById("priceSortSelect").value
    const name =document.getElementById("detailTitle").textContent
    renderPriceHistory(name)
}

function renderStoreOptions(){
    const select = document.getElementById("priceStore")
    const stores = loadData("stores")

    select.innerHTML=""

    /* 初期表示 */
    const defaultOption = document.createElement("option")
    defaultOption.value=""
    defaultOption.textContent="店を選択"
    select.appendChild(defaultOption)

    stores.forEach(store=>{
        const option = document.createElement("option")
        option.value=store
        option.textContent=store
        select.appendChild(option)
    })

    const otherOption = document.createElement("option")
    otherOption.value="その他"
    otherOption.textContent="その他"
    select.appendChild(otherOption)
}

function changePriceType(){
    const type = document.getElementById("priceType").value
    document.getElementById("quantityLabel").textContent = type === "weight" ? "グラム数" : "個数"
    document.getElementById("priceQuantity").placeholder = type === "weight" ? "重量(g)" : "個数"
}

/* =========================
設定画面
========================= */
/** 店名リスト編集 */
function renderStoreList(){
    const ul = document.getElementById("storeList")
    const stores = loadData("stores")
    ul.innerHTML=""
    stores.forEach((store)=>{
        const li = document.createElement("li")

        /* 店名 */
        const text = document.createElement("span")
        text.textContent = store

        /* 削除ボタン */
        const delBtn = document.createElement("button")
        delBtn.textContent = "削除"
        delBtn.onclick=()=>{
            const result = confirm(`${store} を削除しますか？`)
            if(!result)return
            const newStores = stores.filter(s => s !== store)
            saveData("stores", newStores)
            renderStoreList()
        }
        li.appendChild(text)
        li.appendChild(delBtn)
        ul.appendChild(li)
    })
}
function addStore(){
    const input = document.getElementById("storeInput")
    const name = input.value.trim().replace(/\s+/g," ")
    if(!name)return

    const stores = loadData("stores")
    if(stores.includes(name)){
        alert("既に登録されています")
        return
    }

    stores.push(name)
    saveData("stores", stores)
    renderStoreList()
    input.value=""
}

/* =========================
初期表示
========================= */

renderFrequent()
renderVegetableList()
renderLastBackupDate()