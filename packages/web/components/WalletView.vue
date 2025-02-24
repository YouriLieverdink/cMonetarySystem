<template>
  <el-card class="view" :body-style="{ padding: 0 }" shadow="always">
    <div class="wallet_header">
      <div class="dialog_controls">
        <close-button disabled />
        <minimize-button disabled />
        <resize-button disabled />
      </div>
      <div class="action_buttons">
        <el-tooltip
          class="header_item"
          content="Node unreachable, retry"
          placement="bottom"
        >
          <el-button
            v-show="!connected"
            plain
            circle
            type="danger"
            size="large"
            class="action_button mdi mdi-connection"
            @click="retryConnection"
          />
        </el-tooltip>
        <el-tooltip
          class="header_item"
          content="Generate invoice"
          placement="bottom"
        >
          <el-button
            plain
            circle
            size="large"
            class="action_button mdi mdi-qrcode"
            @click="showDialog.genInvoice = true"
          />
        </el-tooltip>
        <el-tooltip class="header_item" content="Send funds" placement="bottom">
          <el-button
            plain
            circle
            size="medium"
            class="action_button el-icon-money"
            @click="showDialog.createTx = true"
          />
        </el-tooltip>
        <el-tooltip
          class="header_item"
          content="Add address"
          placement="bottom"
        >
          <el-button
            plain
            circle
            size="medium"
            class="action_button el-icon-plus"
            @click="showDialog.walletSetup = true"
          />
        </el-tooltip>
      </div>
    </div>
    <el-tabs
      v-model="tab"
      type="border-card"
      tab-position="left"
      class="tabs"
      stretch
    >
      <el-tab-pane name="overview">
        <span slot="label">Wallet Overview <i class="el-icon-wallet" /></span>
        <el-card v-show="tab === 'overview'" shadow="never">
          <template #header>
            <el-row class="summary_header">Wallet Overview</el-row>
          </template>
          <el-row class="summary_row">
            <el-col :span=12>Balance</el-col>
            <el-col :span=12>{{ walletSummary.balance }}</el-col>
          </el-row>
          <el-row class="summary_row">
            <el-col :span=12>Transactions</el-col>
            <el-col :span=12>{{ walletSummary.transactionCount }}</el-col>
          </el-row>
          <el-row class="summary_row">
            <el-col :span=12>Last activity</el-col>
            <el-col :span=12>{{ walletSummary.lastActivity }}</el-col>
          </el-row>
        </el-card>
      </el-tab-pane>
      <el-tab-pane name="addresses">
        <span slot="label">Addresses <i class="el-icon-notebook-1" /></span>
        <transition name="el-fade-in-linear">
          <el-table
            v-show="tab === 'addresses'"
            :data="addresses"
            max-height="468px"
            :row-style="{ 'border-right': '1px solid #ff0000' }"
          >
            <el-table-column label="Public key">
              <template #default="{ row }">
                {{ shortenKeyString(row.publicKey, 40) }}
              </template>
            </el-table-column>
            <el-table-column align="right">
              <template #header> Total: {{ addresses.length }} </template>
              <template slot-scope="{ row }">
                <el-button
                  size="mini"
                  type="danger"
                  :disabled="!connected"
                  @click="handleRemoveAddress(row.publicKey)"
                >
                  Remove
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </transition>
      </el-tab-pane>
      <el-tab-pane name="transactions">
        <span slot="label">Transactions <i class="el-icon-coin" /></span>
        <transition name="el-fade-in-linear">
          <el-table
            v-show="tab === 'transactions'"
            :data="transactions"
            max-height="468px"
          >
            <el-table-column label="Sender" width="220">
              <template #default="{ row }">
                {{
                  shortenKeyString(row.sender, 15).concat(
                    addresses.filter(
                      (address) => address.publicKey === row.sender
                    ).length > 0
                      ? " (You)"
                      : ""
                  )
                }}
              </template>
            </el-table-column>
            <el-table-column label="Receiver">
              <template #default="{ row }">
                {{
                  shortenKeyString(row.receiver, 15).concat(
                    addresses.filter(
                      (address) => address.publicKey === row.receiver
                    ).length > 0
                      ? " (You)"
                      : ""
                  )
                }}
              </template>
            </el-table-column>
            <el-table-column
              label="Amount"
              prop="amount"
              sortable
              width="100"
            />
            <el-table-column label="When" sortable :sort-by="(row, i) => i">
              <template #default="{ row }">
                {{ dateString(row.timestamp) }}
              </template>
            </el-table-column>
          </el-table>
        </transition>
      </el-tab-pane>
      <el-tab-pane name="settings">
        <span slot="label">Settings <i class="el-icon-setting" /></span>
        <transition name="el-fade-in-linear">
          <div v-show="tab === 'settings'">
            <el-card shadow="never">
              <el-row type="flex" align="middle">
                <el-col :span="10"> Save full transaction history </el-col>
                <el-col :span="5">
                  <el-switch
                    :value="settings.mirror"
                    :disabled="!connected"
                    @change="settings.mirror = $event"
                  />
                </el-col>
              </el-row>
              <el-divider />
              <el-row type="flex" align="middle">
                <el-col :span="10"> Clear data </el-col>
                <el-col :span="5">
                  <el-popconfirm
                    title="This action can not be undone!"
                    confirm-button-text="Proceed"
                    cancel-button-text="Cancel"
                    icon="el-icon-info"
                    icon-color="red"
                    @confirm="clearData"
                  >
                    <el-button
                      slot="reference"
                      type="danger"
                      :disabled="!connected"
                      plain
                      size="mini"
                    >
                      Clear data
                    </el-button>
                  </el-popconfirm>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </transition>
      </el-tab-pane>
    </el-tabs>
    <wallet-setup-dialog
      :show="showDialog.walletSetup"
      @close="showDialog.walletSetup = false"
    />
    <create-transaction-dialog
      :show="showDialog.createTx"
      @close="showDialog.createTx = false"
    />
    <generate-invoice-dialog
      :show="showDialog.genInvoice"
      @close="showDialog.genInvoice = false"
    />
  </el-card>
</template>

<script>
import moment from "moment";
import { mapActions, mapState } from "vuex";
import { apiRequest } from "@/core/service/apiService";
import stringMixin from "@/components/mixin/stringMixin";

export default {
  name: "WalletView",
  mixins: [stringMixin],
  data() {
    return {
      showDialog: {
        walletSetup: false,
        createTx: false,
        genInvoice: false,
      },
      tab: "overview",
      connected: true,
      settings: {
        mirror: true,
      },
    };
  },
  computed: {
    ...mapState("wallet", {
      addresses: (state) => state.addresses,
      transactions: (state) => state.transactions,
      balance: (state) => state.balance,
    }),
    walletSummary() {
      const lastActivity = Math.max(
        ...this.transactions.map((e) => e?.timestamp ?? 0)
      );
      return {
        balance: this.balance,
        transactionCount: this.transactions.length,
        lastActivity:
          this.transactions.length > 0
            ? lastActivity > 0
              ? moment(new Date(lastActivity), "YYYYMMDD").fromNow()
              : "unknown"
            : "never",
      };
    },
  },
  mounted() {
    this.refreshAddresses();
    this.refreshDispatcher();
  },
  methods: {
    ...mapActions("wallet", [
      "removeAddress",
      "setAddresses",
      "setTransactions",
      "setBalance",
    ]),
    async handleRemoveAddress(pubKey) {
      try {
        await apiRequest.addresses.remove(pubKey);
        this.removeAddress(pubKey);
      } catch (e) {
        this.$message.error("Address not removed");
        this.connected = e.response !== undefined;
      }
    },
    async refreshAddresses() {
      try {
        const res = await apiRequest.addresses.get();
        this.setAddresses(res.data);
      } catch (e) {
        this.$message.error("Error updating your addresses");
        this.connected = e.response !== undefined;
      }
    },
    async refreshTransactions() {
      try {
        let txs = [];

        for (const { publicKey } of this.addresses) {
          const res = await apiRequest.transactions.get(publicKey);
          txs = [...txs, ...res.data];
        }

        const newTxsAmount = txs.length - this.transactions.length;
        if (newTxsAmount > 0) {
          this.$notify.info({
            title: "Info",
            message: newTxsAmount + " new transactions",
          });
        }

        this.setTransactions(txs);
      } catch (e) {
        this.$message.error("Error updating your transactions");
        this.connected = e.response !== undefined;
      }
    },
    async refreshBalance() {
      try {
        let balance = 0;

        for (const address of this.addresses) {
          const res = await apiRequest.balance.get(address.publicKey);
          balance += res.data;
        }
        // this.addresses.forEach(async ({ publicKey }) => {
        //   const res = await apiRequest.balance.get(publicKey);
        //   // balance += res.data;
        // });

        this.setBalance(balance);
      } catch (e) {
        this.$message.error("Error updating your balance");
        this.connected = e.response !== undefined;
      }
    },
    dateString(date) {
      return date != null ? moment(date).format("lll") : "unknown";
    },
    refreshDispatcher() {
      setTimeout(this.refreshDispatcher, 2000);

      if (this.connected) {
        this.refreshTransactions();
        this.refreshBalance();
      }
    },
    retryConnection() {
      this.connected = true;
    },
    clearData() {
      Promise.all(
        this.addresses.map((a) => this.handleRemoveAddress(a.publicKey))
      )
        .then(() => this.$message.success("Cleared application data"))
        .catch(() => this.$message.error("Could not clear application data"));
    },
  },
};
</script>

<style scoped>
.view {
  background: #444;
}
.wallet_header {
  display: flow-root;
  padding: 12px;
  background: #222;
  border-radius: 4px 4px 0 0;
}
.dialog_controls {
  float: left;
  margin-top: 10px;
}
.action_buttons {
  float: right;
}
.tabs {
  height: 500px;
  border-radius: 0 0 4px 4px;
}
.header_item {
  margin-left: 12px;
}
.action_button {
  padding: 5px;
  font-size: 18px;
}
.summary_header {
  text-align: center;
  font-size: 18px;
}
.summary_row {
  margin: 12px auto 12px;
  width: 400px;
  font-size: 16px;
}
</style>
