# main.py
# This Kivy application collects multi-selected criteria for 5 status labels,
# ensuring each criterion can only be selected once across all labels.
# Data (counts of selected criteria) is sent via email.

# Optimizations for:
# - Improved readability on mobile screens.
# - Unique criterion selection across categories.

# To run this:
# 1. Install Kivy: pip install kivy
# 2. Save this code as 'main.py' in a folder.
# 3. Open a terminal/command prompt, navigate to that folder, and run: python main.py
#    (On Android, just run it in Pydroid 3)

from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.checkbox import CheckBox # For checkboxes in the popup
from kivy.uix.scrollview import ScrollView # For scrollable content in popup
from kivy.uix.popup import Popup # For the multi-select popup
from kivy.clock import Clock # For scheduling non-blocking operations
from kivy.metrics import dp, sp # Import dp (density-independent pixels) and sp (scalable pixels)
from kivy.utils import platform # To check the platform (e.g., 'android')
import webbrowser # To open web links, including mailto: links

import datetime # For getting the current timestamp
import urllib.parse # For URL encoding email body content

# --- Configuration ---
RECIPIENT_EMAIL = '' # e.g., 'your_email@example.com'
EMAIL_SUBJECT = 'Field Report Submission'

# Define the 5 status labels
STATUS_LABELS = [
    "Dentro dos parâmetros",
    "sinal estável",
    "sem danos visíveis",
    "funcionamento normal",
    "possivel problema"
]

# Generate 100 criteria names (CHK001 to CHK100)
ALL_CRITERIA = [f"CHK{i:03d}" for i in range(1, 101)]

class MultiSelectPopupContent(BoxLayout):
    """
    Content for the multi-select popup. Displays a scrollable list of checkboxes.
    Criteria already selected in other categories are disabled.
    """
    def __init__(self, current_selections, globally_selected_set, on_dismiss_callback, popup_instance, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.padding = dp(10)
        self.spacing = dp(10)
        self.on_dismiss_callback = on_dismiss_callback
        self.temp_selections = set(current_selections) # Selections for THIS specific category (editable)
        self.globally_selected_set = globally_selected_set # ALL selections across ALL categories
        self.popup_ref = popup_instance # Store reference to the Popup widget

        # ScrollView to hold the grid of checkboxes
        scroll_view = ScrollView(size_hint_y=1)
        grid_layout = GridLayout(cols=1, spacing=dp(5), size_hint_y=None)
        grid_layout.bind(minimum_height=grid_layout.setter('height'))

        for criterion in ALL_CRITERIA:
            checkbox_layout = BoxLayout(orientation='horizontal', size_hint_y=None, height=dp(40))
            checkbox = CheckBox(size_hint_x=None, width=dp(40))
            label = Label(text=criterion, font_size=sp(16), halign='left', valign='middle') # Removed text_size

            # Determine initial state and disable status
            is_selected_for_this_category = criterion in self.temp_selections
            is_selected_globally = criterion in self.globally_selected_set

            checkbox.active = is_selected_for_this_category # Only active if selected for THIS category
            checkbox.disabled = is_selected_globally and not is_selected_for_this_category # Disable if taken by another category

            # Store criterion name and the initial disabled state for reference
            checkbox.criterion_name = criterion
            checkbox.initial_disabled_state = checkbox.disabled

            # Bind only if the checkbox is not disabled initially
            if not checkbox.disabled:
                checkbox.bind(active=self.on_checkbox_active)
            else:
                # If disabled, change color to indicate it's unavailable/taken
                label.color = (0.5, 0.5, 0.5, 1) # Grey out the label text

            checkbox_layout.add_widget(checkbox)
            checkbox_layout.add_widget(label)
            grid_layout.add_widget(checkbox_layout)

        scroll_view.add_widget(grid_layout)
        self.add_widget(scroll_view)

        # Done button to close the popup
        done_button = Button(
            text="Done",
            size_hint_y=None, height=dp(50),
            font_size=sp(20)
        )
        done_button.bind(on_press=self.dismiss_popup)
        self.add_widget(done_button)

    def on_checkbox_active(self, checkbox, value):
        """
        Updates the temporary set of selected criteria when a checkbox state changes.
        Only processes if the checkbox was not initially disabled (i.e., it's selectable).
        """
        if checkbox.disabled and not checkbox.active:
            # This case should ideally not happen if disabled state is set correctly.
            # It prevents changing a disabled checkbox's state.
            return

        if value:
            self.temp_selections.add(checkbox.criterion_name)
        else:
            self.temp_selections.discard(checkbox.criterion_name)

    def dismiss_popup(self, instance):
        """
        Calls the main app's callback with the final selections and dismisses the popup.
        """
        self.on_dismiss_callback(list(self.temp_selections))
        self.popup_ref.dismiss() # Correctly dismiss the Popup using the stored reference

class MobileAppLayout(BoxLayout):
    """
    Main application layout with 5 status labels and multi-select buttons.
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.padding = dp(20)
        self.spacing = dp(15)

        # Dictionary to store selected criteria for each status label
        self.selected_criteria = {label: [] for label in STATUS_LABELS}
        # Set to store ALL criteria selected across ALL categories (for uniqueness check)
        self.globally_selected_criteria_set = set()
        # Dictionary to hold references to the buttons, so we can update their text
        self.status_buttons = {}

        # Title Label
        self.add_widget(Label(
            text="Field Report (Unique Criteria)",
            font_size=sp(28),
            size_hint_y=None,
            height=dp(60)
        ))

        # Form Layout (GridLayout for labels and multi-select buttons)
        form_layout = GridLayout(
            cols=2,
            spacing=dp(10),
            size_hint_y=None
        )
        form_layout.bind(minimum_height=form_layout.setter('height'))

        # Add the 5 status labels and their corresponding multi-select buttons
        for label_text in STATUS_LABELS:
            # Label for the status category (takes 65% of column width)
            # Removed text_size and set height explicitly to ensure it takes space
            form_layout.add_widget(Label(
                text=f"{label_text}:",
                font_size=sp(18),
                halign='left', # Align text to the left
                valign='middle',
                size_hint_x=0.65, # Give more width to the label
                size_hint_y=None, # Don't scale height with parent
                height=dp(48) # Fixed height to match the button
            ))
            # Button to open the multi-select popup (takes 35% of column width)
            select_button = Button(
                text="0 selected", # Initial text
                font_size=sp(18),
                size_hint_y=None,
                height=dp(48), # Consistent button height
                size_hint_x=0.35 # Less width for the button
            )
            # Use a lambda to pass the specific label_text to the callback
            select_button.bind(on_press=lambda btn, lt=label_text: self.show_multi_select_popup(lt))
            form_layout.add_widget(select_button)
            self.status_buttons[label_text] = select_button # Store button reference

        self.add_widget(form_layout)

        # Status Message Label (to show submission status)
        self.status_label = Label(
            text="",
            font_size=sp(16),
            color=(1, 0, 0, 1),
            size_hint_y=None,
            height=dp(40),
            halign='center',
            valign='middle',
            text_size=(self.width - dp(40), None)
        )
        self.add_widget(self.status_label)

        # Submit Button
        self.submit_button = Button(
            text="Submit Report (via Email)",
            font_size=sp(20),
            size_hint_x=0.8,
            size_hint_y=None,
            height=dp(60),
            pos_hint={'center_x': 0.5}
        )
        self.submit_button.bind(on_press=self.on_submit_data)
        self.add_widget(self.submit_button)

        # Flexible spacer
        self.add_widget(Label(size_hint_y=1))

    def show_multi_select_popup(self, status_label_key):
        """
        Opens a popup for multi-selecting criteria for a given status label.
        Passes current and globally selected criteria for uniqueness handling.
        """
        def update_selections_from_popup(selected_items):
            self.selected_criteria[status_label_key] = selected_items
            self.update_global_selections_set() # Rebuild the global set after each popup closes
            self.status_buttons[status_label_key].text = f"{len(selected_items)} selected"

        popup = Popup(
            title=f"Select Criteria for '{status_label_key}'",
            size_hint=(0.9, 0.9),
            auto_dismiss=False
        )
        content = MultiSelectPopupContent(
            current_selections=self.selected_criteria[status_label_key],
            globally_selected_set=self.globally_selected_criteria_set, # Pass the global set
            on_dismiss_callback=update_selections_from_popup,
            popup_instance=popup
        )
        popup.content = content
        popup.open()

    def update_global_selections_set(self):
        """
        Rebuilds the set of all currently selected criteria across all categories.
        """
        new_global_set = set()
        for selected_list in self.selected_criteria.values():
            new_global_set.update(selected_list)
        self.globally_selected_criteria_set = new_global_set
        print(f"Global selected set updated: {self.globally_selected_criteria_set}")


    def on_submit_data(self, instance):
        """
        Callback function executed when the submit button is pressed.
        Collects data (counts of selected criteria) and attempts to send it via email.
        """
        total_selected = sum(len(v) for v in self.selected_criteria.values())
        if total_selected == 0:
            self.status_label.text = "Please select at least one criteria overall!"
            self.status_label.color = (1, 0, 0, 1)
            return

        self.status_label.text = "Composing email..."
        self.status_label.color = (0, 0, 1, 1)

        Clock.schedule_once(lambda dt: self._send_data_via_email(), 0.1)

    def _send_data_via_email(self):
        """
        Internal function to handle sending data via email.
        Constructs the email body with counts of selected criteria.
        """
        try:
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            email_body_lines = [
                f"Field Report Submission - {timestamp}\n",
                "--- Criteria Counts ---\n"
            ]

            for label, selected_list in self.selected_criteria.items():
                count = len(selected_list)
                email_body_lines.append(f"{label}: {count} selected criteria")
                # If you want to list the actual criteria in the email, uncomment the line below:
                # if count > 0:
                #     email_body_lines.append(f"  [{', '.join(sorted(selected_list))}]") # Sorted for readability

            email_body_lines.append("\n--- End of Report ---")
            email_body = "\n".join(email_body_lines)

            encoded_body = urllib.parse.quote(email_body)
            encoded_subject = urllib.parse.quote(EMAIL_SUBJECT)

            mailto_url = f"mailto:{RECIPIENT_EMAIL}?subject={encoded_subject}&body={encoded_body}"

            webbrowser.open(mailto_url)

            self.status_label.text = "Email composed! Please send it from your email app."
            self.status_label.color = (0, 1, 0, 1)
            print(f"Email composed with data:\n{email_body}")

            self.reset_form()

        except Exception as e:
            error_msg = f"Error composing email: {e}"
            self.status_label.text = error_msg
            self.status_label.color = (1, 0, 0, 1)
            print(error_msg)

    def reset_form(self):
        """Resets all selections and button texts."""
        for label_text in STATUS_LABELS:
            self.selected_criteria[label_text] = []
            self.status_buttons[label_text].text = "0 selected"
        # Crucially, reset the global set after clearing all local selections
        self.globally_selected_criteria_set = set()
        self.status_label.text = ""


class MyMobileApp(App):
    """
    The main application class, inheriting from Kivy's App.
    """
    def build(self):
        """
        The build method is where you define the root widget of your application.
        """
        self.title = 'Field Report App' # Set the app title
        return MobileAppLayout()

# Entry point for the application
if __name__ == '__main__':
    MyMobileApp().run()
