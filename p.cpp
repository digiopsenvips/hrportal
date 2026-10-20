#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Record {
    char date[20];
    float temperature;
    char status[20];
};

void addRecord() {
    FILE *fp;
    struct Record r;

    fp = fopen(".coldchain.dat", "ab");

    if (fp == NULL) {
        printf("Error opening file!\n");
        return;
    }

    printf("\nEnter Date (DD/MM/YYYY): ");
    scanf("%s", r.date);

    printf("Enter Temperature: ");
    scanf("%f", &r.temperature);

    
    if (r.temperature >= 2 && r.temperature <= 8)
        strcpy(r.status, "SAFE");
    else
        strcpy(r.status, "ALERT");

    fwrite(&r, sizeof(r), 1, fp);

    fclose(fp);

    printf("Record stored securely!\n");
}

void displayRecords() {
    FILE *fp;
    struct Record r;

    fp = fopen(".coldchain.dat", "rb");

    if (fp == NULL) {
        printf("No records found!\n");
        return;
    }

    printf("\n------ Cold Chain Records ------\n");

    while (fread(&r, sizeof(r), 1, fp)) {
        printf("\nDate         : %s", r.date);
        printf("\nTemperature  : %.2f C", r.temperature);
        printf("\nStatus       : %s\n", r.status);
    }

    fclose(fp);
}

int main() {
    int choice;

    while (1) {
        printf("\n===== Cold Chain Tracker =====\n");
        printf("1. Add Temperature Record\n");
        printf("2. Display Records\n");
        printf("3. Exit\n");

        printf("Enter your choice: ");
        scanf("%d", &choice);

        switch (choice) {
            case 1:
                addRecord();
                break;

            case 2:
                displayRecords();
                break;

            case 3:
                printf("Exiting Program...\n");
                exit(0);

            default:
                printf("Invalid Choice!\n");
        }
    }

    return 0;
}