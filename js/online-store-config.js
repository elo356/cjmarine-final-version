// Online store config shared by store and cart pages

const ONLINE_STORE_DEFAULT_CONFIG = {
    storeEnabled: true,
    shippingEnabled: false,
    pickupEnabled: false,
    shippingFlatRate: 0,
    freeShippingMinimum: 0
};

let currentOnlineStoreConfig = { ...ONLINE_STORE_DEFAULT_CONFIG };
let onlineStoreConfigPromise = null;

function normalizeOnlineStoreConfig(data) {
    return {
        storeEnabled: data?.storeEnabled !== false,
        shippingEnabled: data?.shippingEnabled === true,
        pickupEnabled: data?.pickupEnabled === true,
        shippingFlatRate: Number(data?.shippingFlatRate) || 0,
        freeShippingMinimum: Number(data?.freeShippingMinimum) || 0
    };
}

async function loadOnlineStoreConfig() {
    if (onlineStoreConfigPromise) {
        return onlineStoreConfigPromise;
    }

    onlineStoreConfigPromise = db.collection('onlineStoreSettings').doc('config').get()
        .then((snapshot) => {
            currentOnlineStoreConfig = normalizeOnlineStoreConfig(snapshot.exists ? snapshot.data() : {});
            document.dispatchEvent(new CustomEvent('onlineStoreConfigChanged', {
                detail: { config: currentOnlineStoreConfig }
            }));
            return currentOnlineStoreConfig;
        })
        .catch((error) => {
            console.error('Error cargando configuracion de tienda online:', error);
            currentOnlineStoreConfig = { ...ONLINE_STORE_DEFAULT_CONFIG };
            return currentOnlineStoreConfig;
        });

    return onlineStoreConfigPromise;
}

function getOnlineStoreConfig() {
    return currentOnlineStoreConfig;
}

function isStoreEnabled() {
    return getOnlineStoreConfig().storeEnabled !== false;
}

function isShippingEnabled() {
    return getOnlineStoreConfig().shippingEnabled === true;
}

function isPickupEnabled() {
    return getOnlineStoreConfig().pickupEnabled === true;
}