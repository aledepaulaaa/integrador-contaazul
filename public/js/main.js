//public/js/main.js
document.getElementById('btn-auth').addEventListener('click', () => {
    window.location.href = '/auth/connect';
});
document.getElementById('btn-disconnect').addEventListener('click', () => {
    window.location.href = '/auth/disconnect';
});

const $ = (s) => document.querySelector(s);

async function fetchEntity(entity, startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `/api/${entity}?${params.toString()}`;
    const res = await fetch(url);
    const json = await res.json();
    return json;
}

$('#btn-filtrar').addEventListener('click', async () => {
    const entity = $('#filter-entity').value;
    const startDate = $('#filter-startDate').value;
    const endDate = $('#filter-endDate').value;

    const output = await fetchEntity(entity, startDate, endDate);
    $('#output').innerHTML = '<pre>' + JSON.stringify(output, null, 2) + '</pre>';
});

$('#btn-mostrar-historico').addEventListener('click', async () => {
    const res = await fetch('/api/historico');
    const json = await res.json();
    $('#output').innerHTML = '<pre>' + JSON.stringify(json, null, 2) + '</pre>';
});
