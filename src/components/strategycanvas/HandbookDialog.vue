<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 700px; max-width: 80vw">
      <q-bar>
        <span class="text-weight-bold">Handbook</span>
        <q-space />

        <q-btn v-close-popup flat round dense icon="close" />
      </q-bar>

      <q-splitter v-model="splitterModel" style="height: 500px">
        <template #before>
          <q-tabs v-model="tab" vertical>
            <q-tab name="strategy_canvas" label="Strategy Canvas" />
            <q-tab name="editing" label="Editing" class="text-left" />
            <q-tab name="export" label="Export" />
          </q-tabs>
        </template>

        <template #after>
          <q-tab-panels
            v-model="tab"
            animated
            swipeable
            vertical
            transition-prev="jump-up"
            transition-next="jump-up"
          >
            <q-tab-panel name="strategy_canvas">
              <div class="text-h4 q-mb-md">Strategy Canvas</div>
              <blockquote>
                <p>
                  The strategy canvas is the central diagnostic and action
                  framework for building a compelling blue ocean strategy. The
                  horizontal axis captures the range of factors that the
                  industry competes on and invests in, while the vertical axis
                  captures the offering level that buyers receive across all
                  these key competing factors.
                </p>
                <small
                  ><a
                    href="http://www.blueoceanstrategy.com/about/concepts/strategy-canvas/"
                    >Blue Ocean Strategy&copy; - Strategy Canvas Concept</a
                  >
                  by W. Chan Kim and Renée Mauborgne</small
                >
              </blockquote>

              <p>
                This app helps in designing strategy canvases by allowing to
                interactively create them. Additionally, it provides real-time
                collaboration features, as well as wizards, and other features
                to help facilitate the creation and analysis process.
              </p>

              <ul>
                <li>
                  <a href="http://hbswk.hbs.edu/archive/3020.html"
                    >Charting Your Company's Future - Your Company Strategy in
                    Pictures</a
                  >
                </li>
                <li>
                  <a
                    href="http://www.ignyte.ms/whitepapers/chartingyourcompanysfuture.pdf"
                    >Charting Your Company’s Future,
                    <i>Harvard Business Review, Vol. 80, No. 6, June 2002</i></a
                  >
                </li>
              </ul>

              <p>
                <!-- TODO -->
                <a ng-click="copyExample()"
                  ><i class="icon-copy"></i> Southwest Airlines example</a
                >
              </p>

              <h4>Demonstration of the concept on paper</h4>
              <iframe
                width="640"
                height="480"
                src="http://www.youtube.com/embed/XV_8hLljwUg?rel=0"
                frameborder="0"
                allowfullscreen
              ></iframe>
              by derekjlunde
            </q-tab-panel>

            <q-tab-panel name="editing">
              <div class="text-h4 q-mb-md">Editing</div>
              <p>
                A typical edit session start by adding <i>factors</i> and then
                drawing value curves onto the canvas. We will call each point of
                a <i>value curve</i> on a <i>factor</i> column an
                <i>offering</i>.
              </p>

              <h4>Factors</h4>
              <ul>
                <li>are added by clicking the big plus on the right</li>
                <li>can be removed* or renamed by clicking on their label.</li>
                <li>
                  can be reordered by dragging them at their outside part of
                  their column (blue on the picture)
                </li>
              </ul>
              <p>
                <img src="@/assets/handbook/factor_offering.png" class="frame" />
              </p>

              <h4>Value curves</h4>
              <ul>
                <li>can be added manually by click the new button</li>
                <li>
                  are added automatically if a new offering is added to a
                  factor, which already has offerings for all currently
                  available value curves.
                </li>
                <li>can me removed* or renamed by clicking on their label.</li>
                <li>
                  can have different colors, symbols and line styles by clicking
                  on their symbol in the legend bar.
                </li>
              </ul>

              <p>
                <img src="@/assets/handbook/serie_marker.png" class="frame" />
              </p>

              <h4>Offerings</h4>
              <ul>
                <li>
                  can be added by clicking in the middle part of a
                  <i>factor</i> column (red on the picture)
                </li>
                <li>can be dragged to change their value.</li>
                <li>
                  can be removed by dragging them outside the canvas'bottom
                  border.
                </li>
              </ul>
              <p>
                <img src="@/assets/handbook/factor_offering.png" class="frame" />
              </p>

              <h4>*About removing</h4>
              <p>
                Removing does not delete the values, but only hides them from
                the canvas. Adding the same factor or value curve, will bring
                the connected data back onto the canvas.
              </p>
            </q-tab-panel>
            <q-tab-panel name="export">
              <div class="text-h4 q-mb-md">Export</div>
              <p>
                In the options menu (top right), you can get either a
                <b>CSV</b> or a <b>JSON</b> export.
              </p>
              <p>
                <b>CSV</b> exports can be opened in Excel or any other
                spreadsheet programme to draw the same chart.
              </p>
              <p>
                <img src="@/assets/handbook/options_export.png" class="frame" />
              </p>
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-splitter>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { ref, defineComponent } from 'vue';

export default defineComponent({
  emits: [
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits,
  ],

  setup() {
    // REQUIRED; must be called inside of setup()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
      useDialogPluginComponent();
    // dialogRef      - Vue ref to be applied to QDialog
    // onDialogHide   - Function to be used as handler for @hide on QDialog
    // onDialogOK     - Function to call to settle dialog with "ok" outcome
    //                    example: onDialogOK() - no payload
    //                    example: onDialogOK({ /*.../* }) - with payload
    // onDialogCancel - Function to call to settle dialog with "cancel" outcome

    return {
      // This is REQUIRED;
      // Need to inject these (from useDialogPluginComponent() call)
      // into the vue scope for the vue html template
      tab: ref('strategy_canvas'),
      splitterModel: ref(20),
      dialogRef,
      onDialogHide,
      onOKClick() {
        onDialogOK();
      },
      // we can passthrough onDialogCancel directly
      onCancelClick: onDialogCancel,
    };
  },
});
</script>
