const { createApp } = Vue;

createApp({
    data() {
        return {
            showNotification: true,
            compareEnabled: false,
            dateRange: '2025年12月9日 - 2026年3月24日',
            pageSize: 10,
            currentPage: 1,
            sortKey: '',
            sortOrder: 'desc',
            selectAll: false,
            filterText: localStorage.getItem('filterText') || '',
            campaigns: [
                {
                    id: 1,
                    name: '0254-PH Space Race-Kilay',
                    cost: 7.93,
                    impressions: 32,
                    clicks: 3,
                    avgCpc: 2.64,
                    ctr: 9.38,
                    installs: 0.78,
                    costPerInstall: 10.17,
                    inAppActions: 0.38,
                    costPerAction: 20.87,
                    selected: false
                },
                {
                    id: 2,
                    name: 'PH-MM-150115552-ANX-Video-Complete 60s-Purchase-Play',
                    cost: 52.79,
                    impressions: 96,
                    clicks: 0,
                    avgCpc: 0,
                    ctr: 0,
                    installs: 0.78,
                    costPerInstall: 67.68,
                    inAppActions: 0.38,
                    costPerAction: 138.92,
                    selected: false
                },
                {
                    id: 3,
                    name: 'PH-MM-150096792-ANX-Video-Complete 60s-Purchase-Play',
                    cost: 49.30,
                    impressions: 60,
                    clicks: 0,
                    avgCpc: 0,
                    ctr: 0,
                    installs: 1.25,
                    costPerInstall: 39.44,
                    inAppActions: 0.5,
                    costPerAction: 98.6,
                    selected: false
                },
                {
                    id: 4,
                    name: 'PH-MM-150112346-ANX-Video-Complete 60s-Purchase-Play',
                    cost: 44.32,
                    impressions: 45,
                    clicks: 0,
                    avgCpc: 0,
                    ctr: 0,
                    installs: 0.78,
                    costPerInstall: 56.82,
                    inAppActions: 0.25,
                    costPerAction: 177.28,
                    selected: false
                },
                {
                    id: 5,
                    name: 'PH-MM-150099979-ANX-Video-Complete 60s-Purchase-Play',
                    cost: 38.35,
                    impressions: 39,
                    clicks: 0,
                    avgCpc: 0,
                    ctr: 0,
                    installs: 0.78,
                    costPerInstall: 49.17,
                    inAppActions: 0.38,
                    costPerAction: 100.92,
                    selected: false
                },
                {
                    id: 6,
                    name: 'PH-MM-150102056-ANX-Video-Complete 60s-Purchase-Play',
                    cost: 22.21,
                    impressions: 33,
                    clicks: 0,
                    avgCpc: 0,
                    ctr: 0,
                    installs: 0.78,
                    costPerInstall: 28.47,
                    inAppActions: 0.38,
                    costPerAction: 58.45,
                    selected: false
                },
                {
                    id: 7,
                    name: 'PH-MM-150115553-ANX-Video-Complete 60s-Purchase-Play',
                    cost: 21.52,
                    impressions: 21,
                    clicks: 0,
                    avgCpc: 0,
                    ctr: 0,
                    installs: 0.78,
                    costPerInstall: 27.59,
                    inAppActions: 0.38,
                    costPerAction: 56.63,
                    selected: false
                },
                {
                    id: 8,
                    name: 'PH-MM-150113769-ANX-Video-Complete 60s-Purchase-Play',
                    cost: 18.13,
                    impressions: 30,
                    clicks: 0,
                    avgCpc: 0,
                    ctr: 0,
                    installs: 0.78,
                    costPerInstall: 23.24,
                    inAppActions: 0.38,
                    costPerAction: 47.71,
                    selected: false
                },
                {
                    id: 9,
                    name: 'PH-MM-150099980-ANX-Video-Complete 60s-Purchase-Play',
                    cost: 12.56,
                    impressions: 21,
                    clicks: 0,
                    avgCpc: 0,
                    ctr: 0,
                    installs: 0.78,
                    costPerInstall: 16.10,
                    inAppActions: 0.38,
                    costPerAction: 33.05,
                    selected: false
                },
                {
                    id: 10,
                    name: 'PH-MM-150099547-ANX-Video-Complete 60s-Purchase-Play',
                    cost: 9.37,
                    impressions: 9,
                    clicks: 0,
                    avgCpc: 0,
                    ctr: 0,
                    installs: 0.78,
                    costPerInstall: 12.01,
                    inAppActions: 0.38,
                    costPerAction: 24.66,
                    selected: false
                }
            ]
        }
    },
    computed: {
        filteredCampaigns() {
            return this.campaigns;
            // if (!this.filterText) {
            //     return this.campaigns;
            // }
            // const filter = this.filterText.toLowerCase();
            // return this.campaigns.filter(campaign =>
            //     campaign.name.toLowerCase().includes(filter)
            // );
        },
        sortedCampaigns() {
            if (!this.sortKey) {
                return this.filteredCampaigns;
            }

            const key = this.sortKey;
            const order = this.sortOrder;

            return [...this.filteredCampaigns].sort((a, b) => {
                let aVal = a[key];
                let bVal = b[key];

                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return order === 'asc' ? -1 : 1;
                if (aVal > bVal) return order === 'asc' ? 1 : -1;
                return 0;
            });
        },
        paginatedCampaigns() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.sortedCampaigns.slice(start, end);
        },
        totalPages() {
            return Math.ceil(this.filteredCampaigns.length / this.pageSize);
        },
        startRow() {
            return (this.currentPage - 1) * this.pageSize + 1;
        },
        endRow() {
            return Math.min(this.currentPage * this.pageSize, this.filteredCampaigns.length);
        },
        totals() {
            return this.filteredCampaigns.reduce((acc, campaign) => {
                acc.cost += campaign.cost;
                acc.impressions += campaign.impressions;
                acc.clicks += campaign.clicks;
                acc.installs += campaign.installs;
                acc.inAppActions += campaign.inAppActions;
                return acc;
            }, {
                cost: 0,
                impressions: 0,
                clicks: 0,
                installs: 0,
                inAppActions: 0,
                ctr: 0,
                costPerAction: 0
            });
        }
    },
    methods: {
        formatCurrency(value) {
            if (value === 0 || value === undefined) return '—';
            return `US$${value.toFixed(2)}`;
        },
        formatNumber(value, decimals = 0) {
            if (value === undefined || value === null) return '—';
            if (value === 0) return '0';

            if (decimals > 0) {
                return value.toFixed(decimals);
            }

            if (value >= 1000) {
                return value.toLocaleString();
            }
            return value.toString();
        },
        formatPercent(value) {
            if (value === 0 || value === undefined) return '—';
            return `${value.toFixed(2)}%`;
        },
        sortBy(key) {
            if (this.sortKey === key) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortKey = key;
                this.sortOrder = 'desc';
            }
        },
        toggleSelectAll() {
            this.campaigns.forEach(campaign => {
                campaign.selected = this.selectAll;
            });
        },
        downloadReport() {
            alert('下载功能开发中...');
        },
        saveFilter() {
            localStorage.setItem('filterText', this.filterText);
        },
        clearFilter() {
            this.filterText = '';
            localStorage.removeItem('filterText');
        }
    },
    watch: {
        campaigns: {
            handler(newValue) {
                const allSelected = newValue.every(campaign => campaign.selected);
                const someSelected = newValue.some(campaign => campaign.selected);
                this.selectAll = allSelected;
            },
            deep: true
        }
    }
}).mount('#app');
