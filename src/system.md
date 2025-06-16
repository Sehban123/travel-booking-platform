flowchart TD
    A[User] --> B[Frontend Client]
    B --> C[API Request to Express.js Server]

    C --> D1[Authentication & Validation]
    D1 --> D2[Check Service Type]
    D2 --> E[Route Handler]

    E --> F[Business Logic Execution]
    F --> G{Service Type}
    
    G --> H1[Accommodation Service Logic]
    G --> H2[Transportation Service Logic]
    G --> H3[Sport Adventure Service Logic]
    G --> H4[Business Inquiry Logic]

    H1 --> I1[Accommodation DB Operations]
    H2 --> I2[Transportation DB Operations]
    H3 --> I3[Sport Adventure DB Operations]
    H4 --> I4[Business Inquiry DB Operations]

    F --> J[File/Image Upload (multer)]
    F --> K[Send Email (Nodemailer)]
    
    I1 --> L[MongoDB via Mongoose]
    I2 --> L
    I3 --> L
    I4 --> L

    L --> M[Response to Express.js]
    M --> N[Send JSON Response to Frontend]
