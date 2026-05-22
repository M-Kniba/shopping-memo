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
    const today=new Date().toISOString().split("T")[0]
    document.getElementById("priceDate").value=today
    document.getElementById("priceName").value=name
}

function openPriceDetail(name){
    show("priceDetailScreen")
    document.getElementById("detailTitle").textContent=name
    renderPriceHistory(name)
}


/* =========================
localStorage
========================= */

function getShoppingList(){
    return JSON.parse(localStorage.getItem("shoppingList")||"[]")
}

function saveShoppingList(data){
    localStorage.setItem("shoppingList",JSON.stringify(data))
}

function getFrequentItems(){
    return JSON.parse(localStorage.getItem("frequentItems")||"[]")
}

function saveFrequentItems(data){
    localStorage.setItem("frequentItems",JSON.stringify(data))
}

function getPriceHistory(){
    return JSON.parse(localStorage.getItem("priceHistory")||"[]")
}

function savePriceHistory(data){
    localStorage.setItem("priceHistory",JSON.stringify(data))
}


/* =========================
買い物メモ
========================= */

function addCustom(){
    const input=document.getElementById("itemInput")
    const name=input.value.trim()
    if(!name)return

    const items=getShoppingList()
    items.push({
        name:name,
        checked:false
    })

    saveShoppingList(items)
    input.value=""
    alert("追加しました")
}

function renderShoppingList(){
    const ul=document.getElementById("shoppingList")
    const items=getShoppingList()
    ul.innerHTML=""

    items.forEach((item,index)=>{
        const li=document.createElement("li")
        li.textContent=item.name
        if(item.checked){
            li.classList.add("checked")
        }

        li.onclick=()=>{
            item.checked=!item.checked
            saveShoppingList(items)
            renderShoppingList()
        }
        ul.appendChild(li)
    })
}

function clearAll(){
    localStorage.removeItem("shoppingList")
    renderShoppingList()
}


/* =========================
よく買うもの
========================= */

function addFrequent(){
    const input=document.getElementById("frequentInput")
    const name=input.value.trim()
    if(!name)return

    const items=getFrequentItems()
    items.push({
        name:name
    })

    saveFrequentItems(items)
    input.value=""
    renderFrequent()
}

function renderFrequent(){
    const area=document.getElementById("frequentItems")
    const items=getFrequentItems()
    area.innerHTML=""

    items.forEach(item=>{
        const btn=document.createElement("button")
        btn.textContent=item.name
        btn.onclick=()=>{
            const shopping=getShoppingList()
            shopping.push({
                name:item.name,
                checked:false
            })
            saveShoppingList(shopping)
            renderShoppingList()
            alert("追加しました")
        }
    area.appendChild(btn)
    })
}


/* =========================
価格メモ
========================= */

function addPriceHistory(){
    const name=document.getElementById("priceName").value.trim()
    const storeSelect=document.getElementById("priceStore").value
    const otherStore=document.getElementById("otherStore").value.trim()
    const store = storeSelect==="その他" ? otherStore : storeSelect
    const quantity=Number(document.getElementById("priceQuantity").value)
    const total=Number(document.getElementById("priceTotal").value)
    const date=document.getElementById("priceDate").value

    if(!name || !store || !quantity || !total || !date){
        alert("入力してください")
        return
    }

    const unitPrice=(total/quantity).toFixed(2)
    const history=getPriceHistory()
    if(editingPriceId){
        const index = history.findIndex(
            item => item.id === editingPriceId
        )
        history[index] = {
            id:editingPriceId,
            name:name,
            store:store,
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
        quantity:quantity,
        total:total,
        unitPrice:unitPrice,
        date:date
        })
    }

    savePriceHistory(history)

    document.getElementById("priceName").value=""
    document.getElementById("priceStore").value=""
    document.getElementById("otherStore").value=""
    document.getElementById("otherStore").style.display="none"
    document.getElementById("priceQuantity").value=""
    document.getElementById("priceTotal").value=""
    alert("保存しました")
    renderVegetableList()
}

function renderVegetableList(){
    const area=document.getElementById("vegetableList")
    const history=getPriceHistory()
    const uniqueNames=[...new Set(history.map(h=>h.name))]
    area.innerHTML=""

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
    let history=getPriceHistory().filter(item=>item.name===name)

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
        li.innerHTML=`
            <div>${item.date}</div>
            <div>${item.store}</div>
            <div>${item.quantity}個 / ${item.total}円</div>
            <div><strong>1個あたり ${item.unitPrice}円</strong></div>
        `
        ul.appendChild(li)
    })
}

function openPriceEdit(id){
    const history=getPriceHistory()
    const item=history.find(h=>h.id===id)
    if(!item)return
    editingPriceId=id
    show("priceAddScreen")

    const select=document.getElementById("priceStore")
    const other=document.getElementById("otherStore")
    const options=[
        "まいばす",
        "ヨーカドー",
        "アタック",
        "Big-A",
        "ヤマイチ",
        "業務スーパー",
        "コンビニ",
        "その他",
    ]

    if(options.includes(item.store)){
        select.value=item.store
        other.style.display="none"
    }else{
        select.value="その他"
        other.style.display="block"
        other.value=item.store
    }

    document.getElementById("priceName").value=item.name
    document.getElementById("priceQuantity").value=item.quantity
    document.getElementById("priceTotal").value=item.total
    document.getElementById("priceDate").value=item.date
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

/* =========================
初期表示
========================= */

renderFrequent()
renderVegetableList()