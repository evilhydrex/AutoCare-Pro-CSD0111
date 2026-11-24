const starterParts = [
 {id:1,name:"Air Filter",quantity:50,price:450},
 {id:2,name:"Oil Filter",quantity:150,price:400},
 {id:3,name:"Brake Pad",quantity:100,price:850},
 {id:4,name:"Spark Plug",quantity:145,price:200},
 {id:5,name:"Headlamp",quantity:23,price:1200},
 {id:6,name:"Battery",quantity:37,price:5000},
 {id:7,name:"Brake Oil",quantity:150,price:200},
 {id:8,name:"Clutch Plate",quantity:18,price:1800},
 {id:9,name:"Engine Oil",quantity:42,price:650},
 {id:10,name:"Wiper Blade",quantity:9,price:350}
];
let parts = JSON.parse(localStorage.getItem("autocareParts")) || starterParts;
let invoices = JSON.parse(localStorage.getItem("autocareInvoices")) || [];
let nextId = Math.max(0,...parts.map(p=>p.id))+1;

const money = value => "₹" + Number(value).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const saveData = () => { localStorage.setItem("autocareParts",JSON.stringify(parts)); localStorage.setItem("autocareInvoices",JSON.stringify(invoices)); };
const statusFor = qty => qty === 0 ? ["Out of Stock","out-stock"] : qty <= 10 ? ["Low Stock","low-stock"] : ["In Stock","in-stock"];
const statusPill = qty => { const s=statusFor(qty); return `<span class="pill ${s[1]}">${s[0]}</span>`; };

function showSection(id){
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));
 document.getElementById(id).classList.add("active-page");
 document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.section===id));
 refreshAll();
}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.section)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.go)));
document.getElementById("todayLabel").textContent = new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});

function refreshAll(){ renderDashboard(); renderInventory(); renderBillOptions(); renderReports(); }
function renderDashboard(){
 document.getElementById("totalProducts").textContent=parts.length;
 document.getElementById("stockValue").textContent=money(parts.reduce((sum,p)=>sum+p.quantity*p.price,0));
 document.getElementById("lowStockCount").textContent=parts.filter(p=>p.quantity<=10).length;
 document.getElementById("invoiceCount").textContent=invoices.length;
 const rows=parts.slice(0,6).map(p=>`<tr><td>#${p.id}</td><td>${escapeHtml(p.name)}</td><td>${p.quantity}</td><td>${money(p.price)}</td><td>${statusPill(p.quantity)}</td></tr>`).join("");
 document.getElementById("dashboardTable").innerHTML=rows || `<tr><td colspan="5" class="empty-row">No inventory records yet.</td></tr>`;
}
function renderInventory(){
 const q=document.getElementById("searchInput").value.toLowerCase();
 const filtered=parts.filter(p=>p.name.toLowerCase().includes(q)||String(p.id).includes(q));
 document.getElementById("inventoryCount").textContent=`${filtered.length} item(s)`;
 document.getElementById("inventoryTable").innerHTML=filtered.map(p=>`<tr><td>#${p.id}</td><td>${escapeHtml(p.name)}</td><td>${p.quantity}</td><td>${money(p.price)}</td><td>${statusPill(p.quantity)}</td><td><button class="action-btn" onclick="editPart(${p.id})">Edit</button><button class="action-btn delete-btn" onclick="deletePart(${p.id})">Delete</button></td></tr>`).join("") || `<tr><td colspan="6" class="empty-row">No matching parts found.</td></tr>`;
}
document.getElementById("searchInput").addEventListener("input",renderInventory);
function openPartForm(part=null){
 document.getElementById("partFormPanel").classList.add("show");
 document.getElementById("formTitle").textContent=part?"Edit Part":"Add New Part";
 document.getElementById("partId").value=part?part.id:"";
 document.getElementById("partName").value=part?part.name:"";
 document.getElementById("partQuantity").value=part?part.quantity:"";
 document.getElementById("partPrice").value=part?part.price:"";
 document.getElementById("partName").focus();
}
function closePartForm(){document.getElementById("partFormPanel").classList.remove("show");document.getElementById("partForm").reset();}
document.getElementById("addPartBtn").addEventListener("click",()=>openPartForm());
document.getElementById("closeFormBtn").addEventListener("click",closePartForm);
document.getElementById("cancelFormBtn").addEventListener("click",closePartForm);
function editPart(id){const part=parts.find(p=>p.id===id);if(part)openPartForm(part);}
function deletePart(id){
 const part=parts.find(p=>p.id===id);
 if(!part)return;
 if(confirm(`Delete ${part.name} from inventory?`)){parts=parts.filter(p=>p.id!==id);saveData();refreshAll();}
}
document.getElementById("partForm").addEventListener("submit",e=>{
 e.preventDefault();
 const id=Number(document.getElementById("partId").value);
 const name=document.getElementById("partName").value.trim();
 const quantity=Number(document.getElementById("partQuantity").value);
 const price=Number(document.getElementById("partPrice").value);
 if(!name||quantity<0||price<=0){alert("Please enter valid part details.");return;}
 if(id){const part=parts.find(p=>p.id===id);Object.assign(part,{name,quantity,price});}
 else{parts.push({id:nextId++,name,quantity,price});}
 saveData();closePartForm();refreshAll();
});
let billCart = [];

function renderBillOptions(){
 const select=document.getElementById("billPart");
 const available=parts.filter(p=>p.quantity>0);
 select.innerHTML=available.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} — ${money(p.price)} (${p.quantity} available)</option>`).join("") || `<option value="">No stock available</option>`;
}

function renderCart(){
 const body=document.getElementById("cartTable");
 document.getElementById("cartItemCount").textContent=`${billCart.length} item(s)`;
 if(billCart.length===0){
   body.innerHTML=`<tr><td colspan="5" class="empty-row">No items added yet.</td></tr>`;
   return;
 }
 body.innerHTML=billCart.map(item=>`<tr>
   <td>${escapeHtml(item.name)}</td>
   <td><input class="cart-qty" aria-label="Quantity for ${escapeHtml(item.name)}" type="number" min="1" max="${item.available}" value="${item.quantity}" onchange="changeCartQuantity(${item.id},this.value)"></td>
   <td>${money(item.price)}</td>
   <td>${money(item.price*item.quantity)}</td>
   <td><button type="button" class="action-btn delete-btn" onclick="removeCartItem(${item.id})">Remove</button></td>
 </tr>`).join("");
}

document.getElementById("addToBillBtn").addEventListener("click",()=>{
 const id=Number(document.getElementById("billPart").value);
 const quantity=Number(document.getElementById("billQuantity").value);
 const part=parts.find(p=>p.id===id);
 if(!part){alert("Please select a spare part.");return;}
 if(!Number.isInteger(quantity)||quantity<1){alert("Enter a valid quantity.");return;}
 const existing=billCart.find(item=>item.id===id);
 const alreadyInCart=existing?existing.quantity:0;
 if(alreadyInCart+quantity>part.quantity){alert(`Only ${part.quantity} unit(s) of ${part.name} are available.`);return;}
 if(existing){existing.quantity+=quantity;}
 else{billCart.push({id:part.id,name:part.name,price:part.price,quantity,available:part.quantity});}
 document.getElementById("billQuantity").value=1;
 renderCart();
});

function changeCartQuantity(id,value){
 const item=billCart.find(i=>i.id===id);
 const quantity=Number(value);
 const part=parts.find(p=>p.id===id);
 if(!item||!part)return;
 if(!Number.isInteger(quantity)||quantity<1||quantity>part.quantity){
   alert(`Enter a quantity between 1 and ${part.quantity}.`);
   renderCart();
   return;
 }
 item.quantity=quantity;
 renderCart();
}
function removeCartItem(id){
 billCart=billCart.filter(item=>item.id!==id);
 renderCart();
}

document.getElementById("billingForm").addEventListener("submit",e=>{
 e.preventDefault();
 const customer=document.getElementById("customerName").value.trim();
 const discountPercent=Number(document.getElementById("discountPercent").value);
 if(!customer){alert("Please enter the customer name.");return;}
 if(billCart.length===0){alert("Please add at least one spare part to the bill.");return;}
 if(!Number.isFinite(discountPercent)||discountPercent<0||discountPercent>100){alert("Discount must be between 0 and 100.");return;}

 // Check every cart line again before changing any stock.
 for(const item of billCart){
   const part=parts.find(p=>p.id===item.id);
   if(!part||item.quantity>part.quantity){
     alert(`Stock is no longer sufficient for ${item.name}. Please review the bill.`);
     renderBillOptions();renderCart();return;
   }
 }
 const subtotal=billCart.reduce((sum,item)=>sum+item.price*item.quantity,0);
 const discount=subtotal*discountPercent/100;
 const total=subtotal-discount;
 billCart.forEach(item=>{
   const part=parts.find(p=>p.id===item.id);
   part.quantity-=item.quantity;
 });
 const invoice={number:invoices.length+1,customer,date:new Date().toLocaleDateString("en-IN"),
   items:billCart.map(item=>({name:item.name,quantity:item.quantity,price:item.price,amount:item.price*item.quantity})),
   subtotal,discountPercent,discount,total};
 invoices.unshift(invoice);saveData();refreshAll();

 const itemRows=invoice.items.map(item=>`<div class="invoice-line"><span>${escapeHtml(item.name)} × ${item.quantity}</span><strong>${money(item.amount)}</strong></div>`).join("");
 document.getElementById("invoicePreview").innerHTML=`<div class="invoice"><p class="eyebrow">AUTOCARE PRO</p><h2>Invoice #${invoice.number}</h2><p class="muted">Automobile Service Station</p><div class="invoice-line"><span>Customer</span><strong>${escapeHtml(customer)}</strong></div><div class="invoice-line"><span>Date</span><strong>${invoice.date}</strong></div>${itemRows}<div class="invoice-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="invoice-line"><span>Discount (${discountPercent}%)</span><strong>− ${money(discount)}</strong></div><div class="invoice-line invoice-total"><span>Amount Payable</span><strong>${money(total)}</strong></div><button class="secondary-btn" onclick="window.print()">Print Invoice</button></div>`;
 billCart=[];
 document.getElementById("billingForm").reset();
 document.getElementById("billQuantity").value=1;
 document.getElementById("discountPercent").value=0;
 renderCart();renderBillOptions();
});

function renderReports(){
 document.getElementById("totalUnits").textContent=parts.reduce((s,p)=>s+p.quantity,0);
 document.getElementById("totalSales").textContent=money(invoices.reduce((s,i)=>s+i.total,0));
 const low=parts.filter(p=>p.quantity<=10);
 document.getElementById("lowStockTable").innerHTML=low.map(p=>`<tr><td>${escapeHtml(p.name)}</td><td>${p.quantity}</td><td>${money(p.price)}</td></tr>`).join("")||`<tr><td colspan="3" class="empty-row">No low-stock items.</td></tr>`;
 document.getElementById("recentInvoices").innerHTML=invoices.slice(0,8).map(i=>`<tr><td>#${i.number}</td><td>${escapeHtml(i.customer)}</td><td>${i.date}</td><td>${money(i.total)}</td></tr>`).join("")||`<tr><td colspan="4" class="empty-row">No invoices created yet.</td></tr>`;
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));}
refreshAll();
