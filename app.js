function CG_initShop(){
const products=PRODUCTS.filter(p=>p.status==='active');
document.getElementById('countAll').textContent=products.length;
document.getElementById('countFeatured').textContent=products.filter(p=>p.featured).length;
}